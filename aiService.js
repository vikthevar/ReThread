// Clothing similarity search service
class ClothingAIService {
  constructor() {
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

  // Generate search query from keywords
  generateSearchQuery(keywords) {
    console.log('Generating search query from keywords:', keywords);
    const queryParts = [];
    
    // Add type first (most important)
    if (keywords.type.length > 0) {
      queryParts.push(keywords.type[0]);
    }
    
    // Add color if available
    if (keywords.color.length > 0) {
      queryParts.push(keywords.color[0]);
    }
    
    // Add style if available
    if (keywords.style.length > 0) {
      queryParts.push(keywords.style[0]);
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
      
      // Add color + type combination
      if (keywords.color.length > 0) {
        queryParts.push(`${keywords.color[0]} ${type}`);
      }
      
      // Add style + type combination
      if (keywords.style.length > 0) {
        queryParts.push(`${keywords.style[0]} ${type}`);
      }
      
      // Add material + type combination
      if (keywords.material.length > 0) {
        queryParts.push(`${keywords.material[0]} ${type}`);
      }
    }

    const query = queryParts.join(' ');
    console.log('Generated search query:', query);
    return query;
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

    // Generate URLs and fetch results for each target site
    const searchPromises = targetSites.map(async site => {
      try {
        console.log('Searching site:', site);
        // Create a clean domain name
        const cleanDomain = site.replace(/^www\./, '');
        
        // Try different common search URL patterns
        const searchPatterns = [
          `https://www.${cleanDomain}/search?q=`,
          `https://www.${cleanDomain}/search?query=`,
          `https://www.${cleanDomain}/search?search=`,
          `https://www.${cleanDomain}/search?search_term=`,
          `https://www.${cleanDomain}/search?keyword=`,
          `https://www.${cleanDomain}/catalog?q=`,
          `https://www.${cleanDomain}/products?q=`,
          `https://www.${cleanDomain}/shop?q=`,
          `https://www.${cleanDomain}/collections/all?q=`,
          `https://www.${cleanDomain}/all?q=`
        ];

        // Try each search pattern until we get results
        for (const pattern of searchPatterns) {
          const url = pattern + encodeURIComponent(searchQuery);
          console.log('Trying URL:', url);
          
          try {
            // Use XMLHttpRequest instead of fetch to avoid CORS issues
            const response = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', url, true);
              xhr.onload = () => {
                if (xhr.status === 200) {
                  resolve(xhr.responseText);
                } else {
                  reject(new Error(`HTTP Error: ${xhr.status}`));
                }
              };
              xhr.onerror = () => reject(new Error('Network Error'));
              xhr.send();
            });

            console.log('Got response from:', url);
            
            // Parse the HTML to extract product information
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            
            // Get site-specific selectors or use defaults
            const selectors = this.siteSelectors[cleanDomain] || this.siteSelectors.default;
            
            // Look for product elements using site-specific selectors
            const productElements = doc.querySelectorAll(selectors.products);
            console.log(`Found ${productElements.length} products on ${site}`);
            
            if (productElements.length > 0) {
              // Extract product information from the first few results
              const products = Array.from(productElements).slice(0, 3).map(element => {
                const title = element.querySelector(selectors.title)?.textContent?.trim() || 'N/A';
                const price = element.querySelector(selectors.price)?.textContent?.trim() || 'N/A';
                const image = element.querySelector(selectors.image)?.src || '';
                
                return {
                  title,
                  price,
                  image,
                  url: element.querySelector('a')?.href || url,
                  platform: site
                };
              });

              return products;
            }
          } catch (error) {
            console.log('Error fetching from pattern:', pattern, error);
            continue;
          }
        }
        
        // If no results found, return a default item
        console.log('No results found for site:', site);
        return [{
          title: `Search results on ${site}`,
          price: 'Varies',
          platform: site,
          url: `https://www.${cleanDomain}/search?q=${encodeURIComponent(searchQuery)}`,
          similarityScore: this.calculateSimilarityScore(keywords)
        }];
      } catch (error) {
        console.error('Error searching site:', site, error);
        return null;
      }
    });

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);
    
    // Flatten results and filter out nulls
    const allResults = results
      .filter(result => result !== null)
      .flat()
      .map(result => ({
        ...result,
        similarityScore: this.calculateSimilarityScore(keywords)
      }));

    console.log('Total results found:', allResults.length);
    
    // Sort by similarity score and return top 5
    const finalResults = allResults
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    console.log('Final results:', finalResults);
    return finalResults;
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
