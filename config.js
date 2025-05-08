module.exports = {
  port: 3000,
  filters: {
    default: {
      removeFromItems: [
        'name',
        'vendorCode',
        'subjectName',
        'brandName',
        'mainPhoto'
      ]
    },
    minimal: {
      removeFromItems: [
        'name', 'vendorCode', 'subjectName', 
        'brandName', 'mainPhoto', 'rating', 
        'feedbackRating'
      ]
    }
  }
};