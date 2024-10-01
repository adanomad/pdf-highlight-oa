const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append("file", file);
    });
  
    try {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        console.error(uploadResponse);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPdfUploaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPdfFile = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/fetch");
        const blobData = await response.blob();
        
        const newPdfFile = URL.createObjectURL(blobData);
        setPdfUrl(newPdfFile);
        setPdfName("skibussy");
        setPdfId("yiggus");
        return () => {
          URL.revokeObjectURL(newPdfFile);
        };
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfFile();
  }, []);
