// utils/sendSMS.js
const https = require('https');
const { URL } = require('url');

class SMSService {
  constructor() {
    this.apiUrl = 'https://api.mobilemessage.com.au/v1/messages';
    this.username = process.env.SMS_USERNAME;
    this.password = process.env.SMS_PASSWORD;
    this.defaultSender = process.env.SMS_SENDER;
  }

  // Check if SMS service is configured
  isConfigured() {
    return !!(this.username && this.password && this.defaultSender);
  }

  // Generate basic auth header
  getAuthHeader() {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  // Make HTTP request using Node.js built-in https module
  makeRequest(url, options, data = null) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = https.request(requestOptions, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data: jsonData
            });
          } catch (error) {
            resolve({
              ok: false,
              status: res.statusCode,
              data: { error: 'Invalid JSON response' }
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  // Validate and format phone number
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.toString().replace(/\D/g, '');
    
    // Handle Australian numbers
    if (cleaned.startsWith('04') && cleaned.length === 10) {
      // Convert 04XXXXXXXX to 614XXXXXXXX (international format)
      return '61' + cleaned.substring(1);
    }
    
    // If already in international format starting with 61
    if (cleaned.startsWith('61') && cleaned.length === 11) {
      return cleaned;
    }
    
    // Return as-is if it looks like a valid international number
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }
    
    throw new Error(`Invalid phone number format: ${phoneNumber}. Use Australian format (04XXXXXXXX) or international format.`);
  }

  // Send SMS
  async sendSMS(phoneNumber, message, customRef = null, sender = null) {
    try {
      // Check if SMS service is configured
      if (!this.isConfigured()) {
        console.warn('⚠️ SMS service not configured. Skipping SMS send.');
        return { 
          success: false, 
          error: 'SMS service not configured. Check SMS_USERNAME, SMS_PASSWORD, and SMS_SENDER environment variables.' 
        };
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Limit message to 765 characters (API limit)
      const truncatedMessage = message.substring(0, 765);
      
      // Prepare message data according to Mobile Message API format
      const messageData = {
        messages: [
          {
            to: formattedPhone,
            message: truncatedMessage,
            sender: sender || this.defaultSender,
            custom_ref: customRef || `sms_${Date.now()}`
          }
        ]
      };

      console.log(`📱 Sending SMS to ${phoneNumber} (formatted: ${formattedPhone})...`);

      // Make API request using built-in https module
      const response = await this.makeRequest(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }, messageData);

      const responseData = response.data;

      // Check response
      if (response.ok && responseData.status === 'complete') {
        const result = responseData.results?.[0];
        
        if (result?.status === 'success') {
          console.log('✅ SMS sent successfully:', {
            messageId: result.message_id,
            to: result.to,
            cost: result.cost,
            customRef: result.custom_ref
          });
          
          return { 
            success: true, 
            data: responseData,
            messageId: result.message_id,
            customRef: result.custom_ref,
            cost: result.cost
          };
        } else {
          console.error('❌ SMS send failed:', result);
          return { 
            success: false, 
            error: result?.error || 'SMS send failed',
            details: result
          };
        }
      } else {
        console.error('❌ SMS API error:', responseData);
        return { 
          success: false, 
          error: responseData.error || 'SMS API request failed',
          details: responseData
        };
      }

    } catch (error) {
      console.error('❌ SMS service error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }


 
}

// Create singleton instance
const smsService = new SMSService();

// Export the service and convenience functions
module.exports = {
  smsService,
  sendSMS: async (phoneNumber, message, customRef = null) => {
    return await smsService.sendSMS(phoneNumber, message, customRef);
  },


};