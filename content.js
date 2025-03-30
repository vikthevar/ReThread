// Product information extractor for different websites
const extractors = {
  'hm.com': () => {
    const title = document.querySelector('.product-name')?.textContent?.trim();
    const price = document.querySelector('.price-value')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    return { title, price, image };
  },
  'shein.com': () => {
    const title = document.querySelector('.product-title')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    return { title, price, image };
  },
  'zara.com': () => {
    const title = document.querySelector('.product-name')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    return { title, price, image };
  }
};

// Function to extract keywords from product title
function extractKeywords(title) {
  if (!title) return [];
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Function to get current website
function getCurrentWebsite() {
  const hostname = window.location.hostname;
  if (hostname.includes('hm.com')) return 'hm.com';
  if (hostname.includes('shein.com')) return 'shein.com';
  if (hostname.includes('zara.com')) return 'zara.com';
  return null;
}

// Main function to extract product information
function extractProductInfo() {
  const website = getCurrentWebsite();
  if (!website || !extractors[website]) return null;

  const productInfo = extractors[website]();
  if (!productInfo.title) return null;

  return {
    ...productInfo,
    keywords: extractKeywords(productInfo.title)
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductInfo') {
    const productInfo = extractProductInfo();
    sendResponse(productInfo);
  }
});

// Observe DOM changes to detect when product information is loaded
const observer = new MutationObserver((mutations) => {
  const website = getCurrentWebsite();
  if (!website) return;

  const productInfo = extractProductInfo();
  if (productInfo) {
    chrome.runtime.sendMessage({
      action: 'productInfoUpdated',
      productInfo
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 