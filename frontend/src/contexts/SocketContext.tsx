import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '@/store';
import { getCurrentTabId } from '@/utils/tabId';
import { logout } from '@/store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = (): SocketContextType => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps): JSX.Element => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Cleanup function to prevent multiple connections
    const cleanup = () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('emergency-lockdown');
        socketRef.current.off('emergency-unlock');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      isConnectingRef.current = false;
    };

    // Don't connect if no user
    if (!user) {
      cleanup();
      return;
    }

    // Don't create new connection if already connecting or connected
    if (isConnectingRef.current || (socketRef.current && socketRef.current.connected)) {
      return;
    }

    isConnectingRef.current = true;

    // Socket URL
    const socketUrl = import.meta.env.VITE_APP_API_URL
      ? import.meta.env.VITE_APP_API_URL.replace('/api', '')
      : 'http://localhost:5500';
    
    const tabId = getCurrentTabId();
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
      forceNew: false,
      // Add tab context to socket auth
      auth: {
        tabId: tabId
      }
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
      // Join user room with tab context
      newSocket.emit('join-user', { 
        userId: user.id, 
        role: user.role,
        tabId: tabId 
      });
      isConnectingRef.current = false;
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnectingRef.current = false;
    });

    // Handle emergency lockdown events
    newSocket.on('emergency-lockdown', (data) => {
      console.log('Emergency lockdown received:', data);
      
      if (user?.role === 'student') {
        // Force logout students immediately
        dispatch(logout());
        navigate('/management/login');
        toast.error('Emergency lockdown activated. You have been logged out for security reasons.', {
          duration: 6000,
          icon: '🚨',
        });
      } else if (user?.role === 'admin' || user?.role === 'super_admin') {
        // Notify admins but don't log them out
        toast.error(`Emergency lockdown activated: ${data.reason}`, {
          duration: 5000,
          icon: '⚠️',
        });
      }
    });

    newSocket.on('emergency-unlock', (data) => {
      console.log('Emergency unlock received:', data);
      
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        
      }
    });

    // Return cleanup with delay to prevent immediate destruction
    return () => {
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanup();
      }, 100); // Small delay to prevent rapid cleanup
    };
  }, [user?.id, user?.role, dispatch, navigate]); // Include user.role and dispatch dependencies

  const contextValue: SocketContextType = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
