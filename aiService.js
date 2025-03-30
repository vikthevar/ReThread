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

    // Generate URLs and fetch results for each target site
    const searchPromises = targetSites.map(async site => {
      try {
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
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              mode: 'cors'
            });

            if (response.ok) {
              const html = await response.text();
              console.log('Got response from:', url);
              
              // Parse the HTML to extract product information
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              
              // Look for product elements (this will need to be customized per site)
              const productElements = doc.querySelectorAll('.product, .item, .listing, .card, article');
              
              if (productElements.length > 0) {
                // Extract product information from the first few results
                const products = Array.from(productElements).slice(0, 3).map(element => {
                  const title = element.querySelector('h1, h2, h3, .title, .name')?.textContent?.trim() || 'N/A';
                  const price = element.querySelector('.price, .amount, [data-price]')?.textContent?.trim() || 'N/A';
                  const image = element.querySelector('img')?.src || '';
                  
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
            }
          } catch (error) {
            console.log('Error fetching from pattern:', pattern, error);
            continue;
          }
        }
        
        // If no results found, return a default item
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

    // Sort by similarity score and return top 5
    return allResults
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
