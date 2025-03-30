// Clothing similarity search service
class ClothingAIService {
  constructor() {
    // Keywords for different aspects of clothing
    this.keywords = {
      style: [
        'casual', 'formal', 'business', 'streetwear', 'athletic', 'bohemian',
        'vintage', 'minimalist', 'preppy', 'punk', 'gothic', 'artistic'
      ],
      type: [
        'dress', 'shirt', 'pants', 'jacket', 'coat', 'sweater', 'hoodie',
        'skirt', 'shorts', 'blazer', 'cardigan', 't-shirt', 'jeans'
      ],
      material: [
        'cotton', 'wool', 'silk', 'denim', 'leather', 'polyester', 'linen',
        'cashmere', 'velvet', 'suede', 'mesh', 'knit', 'fleece'
      ],
      color: [
        'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple',
        'pink', 'brown', 'gray', 'navy', 'beige', 'cream'
      ],
      pattern: [
        'solid', 'striped', 'floral', 'plaid', 'polka dot', 'checkered',
        'animal print', 'camouflage', 'geometric', 'abstract', 'tie dye'
      ]
    };
  }

  // Extract keywords from text
  extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const foundKeywords = {
      style: [],
      type: [],
      material: [],
      color: [],
      pattern: []
    };

    // Check each word against our keyword categories
    words.forEach(word => {
      Object.entries(this.keywords).forEach(([category, keywords]) => {
        if (keywords.includes(word)) {
          foundKeywords[category].push(word);
        }
      });
    });

    return foundKeywords;
  }

  // Generate search query from keywords
  generateSearchQuery(keywords) {
    const queryParts = [];
    Object.values(keywords).forEach(categoryKeywords => {
      if (categoryKeywords.length > 0) {
        queryParts.push(categoryKeywords[0]); // Use the first keyword from each category
      }
    });
    return queryParts.join(' ');
  }

  // Find similar items based on description
  async findSimilarItems(description, targetSites) {
    console.log('Finding similar items for description:', description);
    
    // Extract keywords from the description
    const keywords = this.extractKeywords(description);
    console.log('Extracted keywords:', keywords);
    
    // Generate search query
    const searchQuery = this.generateSearchQuery(keywords);
    console.log('Generated search query:', searchQuery);

    // Generate URLs for each target site
    const similarItems = targetSites.map(site => {
      let url;
      switch(site) {
        case 'depop.com':
          url = `https://www.depop.com/search?q=${encodeURIComponent(searchQuery)}`;
          break;
        case 'poshmark.com':
          url = `https://poshmark.com/search?query=${encodeURIComponent(searchQuery)}`;
          break;
        case 'thredup.com':
          url = `https://www.thredup.com/search?search_term=${encodeURIComponent(searchQuery)}`;
          break;
        case 'mercari.com':
          url = `https://www.mercari.com/search?keyword=${encodeURIComponent(searchQuery)}`;
          break;
        case 'vinted.com':
          url = `https://www.vinted.com/catalog?search_text=${encodeURIComponent(searchQuery)}`;
          break;
        case 'etsy.com':
          url = `https://www.etsy.com/search?q=${encodeURIComponent(searchQuery)}`;
          break;
        case 'ebay.com':
          url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
          break;
        default:
          url = `https://www.${site}/search?q=${encodeURIComponent(searchQuery)}`;
      }

      // Calculate similarity score based on keyword matches
      const similarityScore = this.calculateSimilarityScore(keywords);

      return {
        title: `Similar items on ${site}`,
        price: 'Varies',
        platform: site,
        url: url,
        similarityScore: similarityScore
      };
    });

    // Sort by similarity score and return top 5
    return similarItems
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);
  }

  // Calculate similarity score based on keyword matches
  calculateSimilarityScore(keywords) {
    let score = 0;
    let totalKeywords = 0;

    // Weight different aspects of the match
    const weights = {
      type: 0.4,    // Most important - type of clothing
      style: 0.2,   // Style category
      color: 0.2,   // Color matching
      material: 0.1, // Material type
      pattern: 0.1  // Pattern matching
    };

    Object.entries(keywords).forEach(([category, categoryKeywords]) => {
      if (categoryKeywords.length > 0) {
        score += weights[category] * (categoryKeywords.length / this.keywords[category].length);
      }
      totalKeywords += this.keywords[category].length;
    });

    return score;
  }
}

// Create and expose the service globally
window.clothingService = new ClothingAIService();
