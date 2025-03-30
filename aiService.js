// Clothing similarity search service
class ClothingAIService {
  constructor() {
    // Google Cloud Vision API configuration
    this.apiKey = 'AIzaSyBGA4LuZ5FxSgLTiiGfp3na41oekTDAf48'; // Will be set manually
    this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
    
    // Keywords for different aspects of clothing
    this.keywords = {
      style: [
        'casual', 'formal', 'business', 'streetwear', 'athletic', 'bohemian',
        'vintage', 'minimalist', 'preppy', 'punk', 'gothic', 'artistic',
        'classic', 'modern', 'retro', 'sporty', 'elegant', 'chic',
        'urban', 'rural', 'beach', 'party', 'workout', 'lounge',
        'plain', 'basic', 'simple', 'essential', 'everyday', 'versatile',
        'timeless', 'traditional', 'contemporary', 'relaxed', 'fitted',
        'oversized', 'slim', 'loose', 'cropped', 'long', 'short'
      ],
      type: [
        'dress', 'shirt', 'pants', 'jacket', 'coat', 'sweater', 'hoodie',
        'skirt', 'shorts', 'blazer', 'cardigan', 't-shirt', 'jeans',
        'top', 'blouse', 'sweatshirt', 'jumpsuit', 'romper', 'vest',
        'sweatpants', 'leggings', 'tank', 'tank top', 'crop top', 'bodysuit',
        'tee', 'tshirt', 't shirt', 'tee shirt', 'teeshirt', 't-shirt',
        'basic tee', 'basic t-shirt', 'essential tee', 'essential t-shirt'
      ],
      material: [
        'cotton', 'wool', 'silk', 'denim', 'leather', 'polyester', 'linen',
        'cashmere', 'velvet', 'suede', 'mesh', 'knit', 'fleece',
        'rayon', 'spandex', 'nylon', 'chiffon', 'satin', 'jersey',
        'flannel', 'corduroy', 'canvas', 'tweed', 'lace', 'sequin',
        'organic cotton', 'recycled cotton', 'bamboo', 'modal', 'lyocell',
        'recycled polyester', 'recycled materials', 'sustainable materials'
      ],
      color: [
        'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple',
        'pink', 'brown', 'gray', 'navy', 'beige', 'cream',
        'orange', 'burgundy', 'maroon', 'teal', 'turquoise', 'lavender',
        'khaki', 'olive', 'tan', 'gold', 'silver', 'bronze',
        'charcoal', 'dark', 'light', 'neutral', 'monochrome', 'solid'
      ],
      pattern: [
        'solid', 'striped', 'floral', 'plaid', 'polka dot', 'checkered',
        'animal print', 'camouflage', 'geometric', 'abstract', 'tie dye',
        'leopard', 'zebra', 'snake', 'houndstooth', 'herringbone', 'argyle',
        'chevron', 'paisley', 'giraffe', 'tropical', 'tribal', 'military',
        'plain', 'basic', 'simple', 'clean', 'minimal', 'none'
      ]
    };

    // Site-specific selectors for product information
    this.siteSelectors = {
      'depop.com': {
        products: '.product-card',
        title: '.product-title',
        price: '.product-price',
        image: '.product-image img'
      },
      'poshmark.com': {
        products: '.tile',
        title: '.tile__title',
        price: '.tile__price',
        image: '.tile__image img'
      },
      'thredup.com': {
        products: '.product-card',
        title: '.product-title',
        price: '.product-price',
        image: '.product-image img'
      },
      'etsy.com': {
        products: '.v2-listing-card',
        title: '.v2-listing-card__title',
        price: '.currency-value',
        image: '.wt-width-full'
      },
      'ebay.com': {
        products: '.s-item',
        title: '.s-item__title',
        price: '.s-item__price',
        image: '.s-item__image-img'
      },
      'default': {
        products: '.product, .item, .listing, .card, article, .product-card, .product-item, .product-grid-item, .product-tile, .product-listing',
        title: 'h1, h2, h3, .title, .name, .product-title, .item-title, .listing-title',
        price: '.price, .amount, [data-price], .product-price, .item-price, .listing-price',
        image: 'img, .product-image img, .item-image img, .listing-image img'
      }
    };
  }

  // Set API key
  setApiKey(key) {
    this.apiKey = key;
    console.log('API key set');
  }

  // Convert image URL to base64
  async imageUrlToBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  // Analyze image using Google Cloud Vision API
  async analyzeImage(imageUrl) {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    try {
      const base64Image = await this.imageUrlToBase64(imageUrl);
      
      const requestBody = {
        requests: [{
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            },
            {
              type: 'WEB_DETECTION',
              maxResults: 10
            }
          ]
        }]
      };

      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.responses[0];
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  // Find similar items based on image and description
  async findSimilarItems(description, imageUrl, targetSites) {
    console.log('Finding similar items for:', { description, imageUrl });
    
    try {
      // Analyze image using Google Cloud Vision API
      const analysis = await this.analyzeImage(imageUrl);
      
      // Extract keywords from description
      const keywords = this.extractKeywords(description);
      
      // Get web detection results
      const webDetection = analysis.webDetection;
      const visuallySimilarImages = webDetection.visuallySimilarImages || [];
      
      // Generate search results
      const similarItems = visuallySimilarImages.map(image => {
        const url = image.url;
        const site = this.getSiteFromUrl(url);
        
        // Calculate similarity score based on both visual similarity and keyword matches
        const visualScore = image.score || 0;
        const keywordScore = this.calculateSimilarityScore(keywords);
        const combinedScore = (visualScore + keywordScore) / 2;
        
        return {
          title: `Similar item on ${site}`,
          price: 'Varies',
          platform: site,
          url: url,
          image: url,
          similarityScore: combinedScore
        };
      });

      // Sort by similarity score and return top 5
      return similarItems
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 5);
    } catch (error) {
      console.error('Error finding similar items:', error);
      throw error;
    }
  }

  // Extract site from URL
  getSiteFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'unknown';
    }
  }

  // Extract keywords from text
  extractKeywords(text) {
    console.log('Extracting keywords from text:', text);
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

    // If no keywords found, try to infer from common patterns
    if (Object.values(foundKeywords).every(arr => arr.length === 0)) {
      console.log('No keywords found, trying to infer...');
      if (text.toLowerCase().includes('t-shirt') || text.toLowerCase().includes('tee')) {
        foundKeywords.type.push('t-shirt');
      }
      if (text.toLowerCase().includes('black')) {
        foundKeywords.color.push('black');
      }
      if (text.toLowerCase().includes('plain') || text.toLowerCase().includes('basic')) {
        foundKeywords.pattern.push('solid');
      }
    }

    console.log('Found keywords:', foundKeywords);
    return foundKeywords;
  }

  // Calculate similarity score based on keyword matches
  calculateSimilarityScore(keywords) {
    console.log('Calculating similarity score for keywords:', keywords);
    let score = 0;
    
    // Only consider type and color matches
    const weights = {
      type: 0.6,    // Type of clothing (most important)
      color: 0.4    // Color matching
    };

    // Check for type match
    if (keywords.type.length > 0) {
      score += weights.type;
      console.log('Type match found, adding:', weights.type);
    }

    // Check for color match
    if (keywords.color.length > 0) {
      score += weights.color;
      console.log('Color match found, adding:', weights.color);
    }

    // Boost score if we have both type and color matches
    if (keywords.type.length > 0 && keywords.color.length > 0) {
      score += 0.2;
      console.log('Both type and color match found, adding boost:', 0.2);
    }

    const finalScore = Math.min(1, score);
    console.log('Final similarity score:', finalScore);
    return finalScore;
  }
}

// Create and expose the service globally
window.clothingService = new ClothingAIService();
