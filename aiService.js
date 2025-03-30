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
  async findSimilarItems(searchText, imageUrl, targetSites) {
    try {
      console.log('Starting similar items search with:', { searchText, imageUrl, targetSites });
      
      // First, analyze the image using Google Cloud Vision API
      const imageAnalysis = await this.analyzeImage(imageUrl);
      console.log('Image analysis result:', imageAnalysis);
      
      // Extract keywords from both search text and image analysis
      const keywords = this.extractKeywords(searchText);
      const imageKeywords = imageAnalysis.webDetection?.webEntities?.map(entity => entity.description.toLowerCase()) || [];
      const combinedKeywords = [...new Set([...keywords, ...imageKeywords])];
      
      console.log('Combined keywords:', combinedKeywords);
      
      // Generate search queries
      const searchQueries = this.generateSearchQueries(combinedKeywords);
      console.log('Generated search queries:', searchQueries);
      
      // Find similar items on target sites
      const similarItems = [];
      
      // For each target site, search for similar items
      for (const site of targetSites) {
        const siteUrl = `https://${site}`;
        const searchUrl = `${siteUrl}/search?q=${encodeURIComponent(searchQueries[0])}`;
        
        try {
          // Make a request to the search URL
          const response = await fetch(searchUrl);
          const html = await response.text();
          
          // Create a temporary DOM to parse the response
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Find product elements (this is a simplified example)
          const productElements = doc.querySelectorAll('.product-item, .item-card, .product-card');
          
          // Process each product
          for (const element of productElements) {
            const title = element.querySelector('.title, .product-title')?.textContent.trim();
            const price = element.querySelector('.price, .product-price')?.textContent.trim();
            const url = element.querySelector('a')?.href;
            const image = element.querySelector('img')?.src;
            
            if (title && url) {
              // Calculate similarity score
              const similarityScore = this.calculateSimilarityScore(
                combinedKeywords,
                title.toLowerCase(),
                imageAnalysis
              );
              
              if (similarityScore > 0.2) {
                similarItems.push({
                  title,
                  price,
                  url,
                  image,
                  platform: site,
                  similarityScore
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error searching ${site}:`, error);
        }
      }
      
      // Sort by similarity score and return top 5
      similarItems.sort((a, b) => b.similarityScore - a.similarityScore);
      console.log('Found similar items:', similarItems);
      
      return similarItems.slice(0, 5);
    } catch (error) {
      console.error('Error finding similar items:', error);
      return [];
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
  calculateSimilarityScore(keywords, title, imageAnalysis) {
    let score = 0;
    
    // Check keyword matches in title
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        score += 0.4;
      }
    }
    
    // Check visual similarity using image analysis
    if (imageAnalysis.webDetection?.webEntities) {
      const titleWords = title.split(' ');
      for (const entity of imageAnalysis.webDetection.webEntities) {
        if (titleWords.some(word => entity.description.toLowerCase().includes(word))) {
          score += 0.5;
        }
      }
    }
    
    // Add a base score for having any matches
    if (score > 0) {
      score += 0.2;
    }
    
    return Math.min(score, 1); // Cap at 1
  }
}

// Create and expose the service globally
window.clothingService = new ClothingAIService();
