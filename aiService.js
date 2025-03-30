// Service for clothing similarity search
class ClothingService {
  constructor() {
    // Keywords to extract from descriptions
    this.keywordCategories = {
      style: ['casual', 'formal', 'vintage', 'modern', 'streetwear', 'bohemian', 'minimalist', 'athletic', 'preppy', 'grunge'],
      type: ['dress', 'shirt', 'pants', 'jacket', 'sweater', 'hoodie', 'skirt', 'shorts', 'coat', 'blazer'],
      material: ['cotton', 'denim', 'leather', 'silk', 'wool', 'polyester', 'linen', 'suede', 'cashmere', 'velvet'],
      color: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'brown', 'gray', 'navy', 'beige'],
      pattern: ['solid', 'striped', 'floral', 'plaid', 'polka dot', 'checkered', 'leopard', 'camouflage', 'tie dye', 'geometric']
    };
  }

  // Extract keywords from description
  extractKeywords(description) {
    if (!description) return null;

    const keywords = {
      style: this.findKeywords(description, this.keywordCategories.style),
      type: this.findKeywords(description, this.keywordCategories.type),
      material: this.findKeywords(description, this.keywordCategories.material),
      color: this.findKeywords(description, this.keywordCategories.color),
      pattern: this.findKeywords(description, this.keywordCategories.pattern)
    };

    return keywords;
  }

  // Find keywords from a category in the description
  findKeywords(description, categoryKeywords) {
    const lowerDesc = description.toLowerCase();
    return categoryKeywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    );
  }

  // Generate search queries based on keywords
  generateSearchQueries(keywords) {
    const queries = [];
    
    // Type-based query (most important)
    if (keywords.type && keywords.type.length > 0) {
      queries.push(keywords.type[0]);
    }
    
    // Style + Type combination
    if (keywords.style && keywords.style.length > 0 && keywords.type && keywords.type.length > 0) {
      queries.push(`${keywords.style[0]} ${keywords.type[0]}`);
    }
    
    // Color + Type combination
    if (keywords.color && keywords.color.length > 0 && keywords.type && keywords.type.length > 0) {
      queries.push(`${keywords.color[0]} ${keywords.type[0]}`);
    }
    
    // Material + Type combination
    if (keywords.material && keywords.material.length > 0 && keywords.type && keywords.type.length > 0) {
      queries.push(`${keywords.material[0]} ${keywords.type[0]}`);
    }
    
    // Pattern + Type combination
    if (keywords.pattern && keywords.pattern.length > 0 && keywords.type && keywords.type.length > 0) {
      queries.push(`${keywords.pattern[0]} ${keywords.type[0]}`);
    }

    // Full description query
    if (keywords.type && keywords.type.length > 0) {
      const fullQuery = [
        keywords.style?.[0],
        keywords.color?.[0],
        keywords.material?.[0],
        keywords.pattern?.[0],
        keywords.type[0]
      ].filter(Boolean).join(' ');
      queries.push(fullQuery);
    }
    
    return queries;
  }

  // Find similar items based on keywords
  async findSimilarItems(description, marketplaces) {
    try {
      const keywords = this.extractKeywords(description);
      if (!keywords) return [];

      const searchQueries = this.generateSearchQueries(keywords);
      const results = [];

      for (const marketplace of marketplaces) {
        const marketplaceResults = await this.searchMarketplace(marketplace, searchQueries);
        results.push(...marketplaceResults);
      }

      return this.rankResults(results, keywords);
    } catch (error) {
      console.error('Error finding similar items:', error);
      return [];
    }
  }

  // Search specific marketplace
  async searchMarketplace(marketplace, queries) {
    // Implementation will depend on marketplace APIs
    // This is a placeholder for the actual implementation
    return [];
  }

  // Rank results based on keyword matches
  rankResults(results, keywords) {
    return results.sort((a, b) => {
      const scoreA = this.calculateSimilarityScore(a, keywords);
      const scoreB = this.calculateSimilarityScore(b, keywords);
      return scoreB - scoreA;
    });
  }

  // Calculate similarity score between items
  calculateSimilarityScore(item, keywords) {
    let score = 0;
    const itemKeywords = this.extractKeywords(item.description);
    
    if (!itemKeywords) return 0;
    
    // Type match (highest weight)
    if (itemKeywords.type && keywords.type) {
      const typeMatch = this.calculateCategoryMatch(itemKeywords.type, keywords.type);
      score += typeMatch * 0.4;
    }
    
    // Style match
    if (itemKeywords.style && keywords.style) {
      const styleMatch = this.calculateCategoryMatch(itemKeywords.style, keywords.style);
      score += styleMatch * 0.2;
    }
    
    // Color match
    if (itemKeywords.color && keywords.color) {
      const colorMatch = this.calculateCategoryMatch(itemKeywords.color, keywords.color);
      score += colorMatch * 0.2;
    }
    
    // Material match
    if (itemKeywords.material && keywords.material) {
      const materialMatch = this.calculateCategoryMatch(itemKeywords.material, keywords.material);
      score += materialMatch * 0.1;
    }
    
    // Pattern match
    if (itemKeywords.pattern && keywords.pattern) {
      const patternMatch = this.calculateCategoryMatch(itemKeywords.pattern, keywords.pattern);
      score += patternMatch * 0.1;
    }
    
    return score;
  }

  // Calculate match between two keyword categories
  calculateCategoryMatch(category1, category2) {
    const commonKeywords = category1.filter(keyword => 
      category2.includes(keyword)
    );
    return commonKeywords.length / Math.max(category1.length, category2.length);
  }
}

// Export the service
export const clothingService = new ClothingService();
