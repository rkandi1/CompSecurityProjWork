let modificationRules = [];

// Load stored rules when extension starts
// browser.storage.local.get(['modificationRules'], function(result) {
//   if (result.modificationRules) {
//     modificationRules = result.modificationRules;
//   }
// });

// Listen for POST requests
console.log("Testing One!");
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log("Another Test!");
    // Only intercept POST requests with a body
    if (details.method !== "POST" || !details.requestBody) {
      return { cancel: false };
    }

    let requestBody = details.requestBody;
    let modified = false;
    let newRequestBody = requestBody;

    // Check if we have raw data
    if (requestBody.raw) {
      let decoder = new TextDecoder("utf-8");
      let rawStr = '';
      
      for (let i = 0; i < requestBody.raw.length; i++) {
        const bytes = new Uint8Array(requestBody.raw[i].bytes);
        rawStr += decoder.decode(bytes);
      }

      // Apply modification rules
      let modifiedStr = applyModificationRules(rawStr, details.url);
      
      if (modifiedStr !== rawStr) {
        modified = true;
        const encoder = new TextEncoder();
        const modifiedBytes = encoder.encode(modifiedStr);
        newRequestBody = {
          raw: [{bytes: modifiedBytes.buffer}]
        };
      }
    }
    
    // Check if we have form data
    else if (requestBody.formData) {
      // Convert form data to string for easier modification
      let formDataStr = JSON.stringify(requestBody.formData);
      
      // Apply modification rules
      let modifiedFormDataStr = applyModificationRules(formDataStr, details.url);
      
      if (modifiedFormDataStr !== formDataStr) {
        modified = true;
        newRequestBody = {
          formData: JSON.parse(modifiedFormDataStr)
        };
      }
    }

    // If modified, return the new request body
    if (modified) {
      console.log("Modified POST request to: " + details.url);
      return { requestBody: newRequestBody };
    }

    // Otherwise let the request proceed unchanged
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestBody"]
);

// Function to apply modification rules to request body
function applyModificationRules(bodyStr, url) {
  let result = bodyStr;
  
  for (const rule of modificationRules) {
    // Check if rule applies to this URL
    if (rule.urlPattern && !url.includes(rule.urlPattern)) {
      continue;
    }
    
    // Apply the find and replace
    if (rule.find && rule.replace !== undefined) {
      try {
        const regex = new RegExp(rule.find, 'g');
        result = result.replace(regex, rule.replace);
      } catch (e) {
        console.error("Error applying rule:", e);
      }
    }
  }
  
  return result;
}

// Listen for messages from popup
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getModificationRules") {
    sendResponse({rules: modificationRules});
  }
  else if (request.action === "saveModificationRules") {
    modificationRules = request.rules;
    browser.storage.local.set({modificationRules: modificationRules});
    sendResponse({success: true});
  }
});