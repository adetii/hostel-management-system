export const downloadAttachment = async (filename: string, originalName?: string) => {
  try {
    const response = await api.get(`/settings/attachments/${filename}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', originalName || filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file');
  }
};