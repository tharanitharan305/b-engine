export  function buildBookModelFromJSON(bookJSON) {
  
  const processedPages = bookJSON.pages.map((pageData) => {

    const htmlContent = pageData.content?.book?.pages?.[0] || pageData;

    
    return {
      page: pageData.page,
      filename: pageData.filename,
      id: pageData.id,
      size: pageData.size,
      background: pageData.background,
      layers: pageData.layers,
    };
  });

  return {
    title: bookJSON.title,
    version: bookJSON.version,
    author: bookJSON.author,
    image: bookJSON.image,
    pages: processedPages,
  };
}