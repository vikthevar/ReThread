// Clothing similarity search service
class ClothingAIService {
  constructor() {
    // Keywords for different aspects of clothing
    this.keywords = {
      style: [
        'casual', 'formal', 'business', 'streetwear', 'athletic', 'bohemian',
        'vintage', 'minimalist', 'preppy', 'punk', 'gothic', 'artistic',
        'classic', 'modern', 'retro', 'sporty', 'elegant', 'chic',
        'urban', 'rural', 'beach', 'party', 'workout', 'lounge'
      ],
      type: [
        'dress', 'shirt', 'pants', 'jacket', 'coat', 'sweater', 'hoodie',
        'skirt', 'shorts', 'blazer', 'cardigan', 't-shirt', 'jeans',
        'top', 'blouse', 'sweatshirt', 'jumpsuit', 'romper', 'vest',
        'sweatpants', 'leggings', 'tank', 'tank top', 'crop top', 'bodysuit'
      ],
      material: [
        'cotton', 'wool', 'silk', 'denim', 'leather', 'polyester', 'linen',
        'cashmere', 'velvet', 'suede', 'mesh', 'knit', 'fleece',
        'rayon', 'spandex', 'nylon', 'chiffon', 'satin', 'jersey',
        'flannel', 'corduroy', 'canvas', 'tweed', 'lace', 'sequin'
      ],
      color: [
        'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple',
        'pink', 'brown', 'gray', 'navy', 'beige', 'cream',
        'orange', 'burgundy', 'maroon', 'teal', 'turquoise', 'lavender',
        'khaki', 'olive', 'tan', 'gold', 'silver', 'bronze'
      ],
      pattern: [
        'solid', 'striped', 'floral', 'plaid', 'polka dot', 'checkered',
        'animal print', 'camouflage', 'geometric', 'abstract', 'tie dye',
        'leopard', 'zebra', 'snake', 'houndstooth', 'herringbone', 'argyle',
        'chevron', 'paisley', 'giraffe', 'tropical', 'tribal', 'military'
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
    
    // Add type first (most important)
    if (keywords.type.length > 0) {
      queryParts.push(keywords.type[0]);
    }
    
    // Add style if available
    if (keywords.style.length > 0) {
      queryParts.push(keywords.style[0]);
    }
    
    // Add color if available
    if (keywords.color.length > 0) {
      queryParts.push(keywords.color[0]);
    }
    
    // Add material if available
    if (keywords.material.length > 0) {
      queryParts.push(keywords.material[0]);
    }
    
    // Add pattern if available
    if (keywords.pattern.length > 0) {
      queryParts.push(keywords.pattern[0]);
    }

    // If we have a type, create variations
    if (keywords.type.length > 0) {
      const type = keywords.type[0];
      
      // Add style + type combination
      if (keywords.style.length > 0) {
        queryParts.push(`${keywords.style[0]} ${type}`);
      }
      
      // Add color + type combination
      if (keywords.color.length > 0) {
        queryParts.push(`${keywords.color[0]} ${type}`);
      }
      
      // Add material + type combination
      if (keywords.material.length > 0) {
        queryParts.push(`${keywords.material[0]} ${type}`);
      }
    }

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
    
    // Only consider type and color matches
    const weights = {
      type: 0.6,    // Type of clothing (most important)
      color: 0.4    // Color matching
    };

    // Check for type match
    if (keywords.type.length > 0) {
      score += weights.type;
    }

    // Check for color match
    if (keywords.color.length > 0) {
      score += weights.color;
    }

    // Boost score if we have both type and color matches
    if (keywords.type.length > 0 && keywords.color.length > 0) {
      score += 0.2;
    }

    return Math.min(1, score); // Cap at 1
  }
}

// Create and expose the service globally
window.clothingService = new ClothingAIService();
