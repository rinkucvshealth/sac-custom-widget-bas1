(function() {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        display: block;
        font-family: "72", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        height: 100%;
        width: 100%;
      }
      .chatbot-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: #ffffff;
        overflow: hidden;
      }
      .chat-header {
        background: #0070f2;
        color: white;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .chat-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .chat-status {
        font-size: 10px;
        opacity: 0.9;
      }
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f5f5f5;
      }
      .message {
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
      }
      .message.user {
        align-items: flex-end;
      }
      .message.bot {
        align-items: flex-start;
      }
      .message-bubble {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        word-wrap: break-word;
        font-size: 13px;
        line-height: 1.4;
      }
      .message.user .message-bubble {
        background: #0070f2;
        color: white;
        border-bottom-right-radius: 4px;
      }
      .message.bot .message-bubble {
        background: white;
        border: 1px solid #e0e0e0;
        border-bottom-left-radius: 4px;
      }
      .message-time {
        font-size: 10px;
        color: #999;
        margin-top: 4px;
        padding: 0 4px;
      }
      .message-data {
        margin-top: 8px;
        font-size: 11px;
        color: #666;
        background: #e8f5e9;
        padding: 8px;
        border-radius: 4px;
        max-width: 80%;
      }
      .data-table-container {
        margin-top: 12px;
        max-width: 100%;
        overflow-x: auto;
      }
      .data-table {
        background: white;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        overflow: hidden;
      }
      .data-table h4 {
        margin: 0;
        padding: 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #d9d9d9;
        font-size: 12px;
        font-weight: 600;
        color: #333;
      }
      .data-table-content {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .data-table-content th {
        background: #f8f9fa;
        padding: 8px;
        text-align: left;
        font-weight: 600;
        color: #333;
        border-bottom: 1px solid #d9d9d9;
        white-space: nowrap;
      }
      .data-table-content td {
        padding: 8px;
        border-bottom: 1px solid #f0f0f0;
        color: #555;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .data-table-content tr:hover {
        background: #f8f9fa;
      }
      .data-note {
        margin: 0;
        padding: 8px 12px;
        font-size: 10px;
        color: #666;
        background: #f8f9fa;
        font-style: italic;
      }
      .data-row:hover {
        background: #e3f2fd !important;
      }
      .record-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .record-modal {
        background: white;
        border-radius: 8px;
        max-width: 80%;
        max-height: 80%;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      .record-modal-header {
        background: #0070f2;
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .record-modal-header h3 {
        margin: 0;
        font-size: 16px;
      }
      .record-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .record-modal-close:hover {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      .record-modal-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      .record-details {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .field-group {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 16px;
        background: #fafafa;
      }
      .field-group h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #333;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
      }
      .field-item {
        margin-bottom: 8px;
        font-size: 12px;
        line-height: 1.4;
      }
      .field-item strong {
        color: #555;
        display: inline-block;
        min-width: 200px;
      }
      .empty-fields {
        font-size: 11px;
        color: #999;
        font-style: italic;
        line-height: 1.3;
        word-break: break-all;
      }
      .visualization-container {
        margin-top: 12px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .visualize-btn {
        background: #0070f2;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .visualize-btn:hover {
        background: #005bb5;
      }
      .chart-modal {
        max-width: 90%;
        max-height: 90%;
      }
      .chart-container {
        margin-bottom: 20px;
        text-align: center;
      }
      .chart-container canvas {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background: white;
      }
      .chat-input-container {
        border-top: 1px solid #d9d9d9;
        padding: 12px;
        background: white;
        display: flex;
        gap: 8px;
      }
      .chat-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }
      .chat-input:focus {
        border-color: #0070f2;
      }
      .chat-send-btn {
        background: #0070f2;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .chat-send-btn:hover {
        background: #005bb5;
      }
      .chat-send-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .loading {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        max-width: 80%;
        font-size: 13px;
      }
      .loading-dots {
        display: flex;
        gap: 4px;
      }
      .loading-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #0070f2;
        animation: bounce 1.4s infinite ease-in-out;
      }
      .loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .loading-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .error {
        color: #d32f2f;
        background: #ffebee;
        border-color: #ef9a9a;
      }
    </style>
    <div class="chatbot-container">
      <div class="chat-header">
        <div class="chat-header-title">
          <span>🤖 AI Assistant</span>
        </div>
        <div class="chat-status" id="status">Ready</div>
      </div>
      <div class="chat-messages" id="messages">
        <div class="message bot">
          <div class="message-bubble">
            Hello! I'm your SAP data assistant. Ask me anything about your SAP data, like:
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>"Show me customer data"</li>
              <li>"Get sales information"</li>
              <li>"List all products"</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <input 
          type="text" 
          class="chat-input" 
          id="queryInput" 
          placeholder="Ask about SAP data..." 
          autocomplete="off"
        />
        <button class="chat-send-btn" id="sendBtn">Send</button>
      </div>
    </div>
  `;

  class SAPChatbotWidget extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    
    const attrApiEndpoint = this.getAttribute('api-endpoint');
    const attrApiKey = this.getAttribute('api-key');

    this._apiEndpoint = attrApiEndpoint || 'https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api';
    this._apiKey = attrApiKey || '';
    this._isProcessing = false;
    
    // Generate session ID for context management
    this._sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('Generated session ID:', this._sessionId);
    
    this._init();
  }

    _init() {
      this._messagesContainer = this._shadowRoot.getElementById('messages');
      this._inputField = this._shadowRoot.getElementById('queryInput');
      this._sendButton = this._shadowRoot.getElementById('sendBtn');
      this._status = this._shadowRoot.getElementById('status');

      this._sendButton.addEventListener('click', () => this._handleSend());
      this._inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this._isProcessing) {
          this._handleSend();
        }
      });
    }

    async _handleSend() {
      const query = this._inputField.value.trim();
      if (!query || this._isProcessing) return;

      this._addMessage(query, 'user');
      this._inputField.value = '';
      this._isProcessing = true;
      this._updateStatus('Thinking...');
      this._addLoadingIndicator();

      try {
        const response = await this._callAPI(query);
        this._removeLoadingIndicator();
        
        if (response.success) {
          this._addMessage(response.summary, 'bot');
          
          if (response.data && response.data.length > 0) {
            this._addDataMessage(response.data, response.fields);
            this._addVisualizationButton(response.data, response.fields);
            
            // Fire custom event for SAC
            this.dispatchEvent(new CustomEvent('onDataReceived', {
              detail: {
                data: response.data,
                fields: response.fields,
                entity: response.entity,
                summary: response.summary
              },
              bubbles: true,
              composed: true
            }));
          }
        } else {
          this._addMessage(response.error || 'An error occurred', 'bot error');
        }
        
        this._updateStatus('Ready');
      } catch (error) {
        this._removeLoadingIndicator();
        this._addMessage(`Error: ${error.message}`, 'bot error');
        this._updateStatus('Error');
      } finally {
        this._isProcessing = false;
      }
    }

    async _callAPI(query) {
      const response = await fetch(`${this._apiEndpoint}/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this._apiKey
        },
        body: JSON.stringify({ 
          query,
          sessionId: this._sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    }

    _addMessage(text, type) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${type}`;
      
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'message-bubble';
      bubbleDiv.innerHTML = text;
      
      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = new Date().toLocaleTimeString();
      
      messageDiv.appendChild(bubbleDiv);
      messageDiv.appendChild(timeDiv);
      
      this._messagesContainer.appendChild(messageDiv);
      this._scrollToBottom();
    }

    _addDataMessage(data, fields) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot';
      
      // Add summary message
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'message-data';
      summaryDiv.innerHTML = `📊 Retrieved ${data.length} record${data.length !== 1 ? 's' : ''} with ${fields.length} field${fields.length !== 1 ? 's' : ''}`;
      messageDiv.appendChild(summaryDiv);
      
      // Add actual data table
      if (data && data.length > 0) {
        const tableDiv = document.createElement('div');
        tableDiv.className = 'data-table-container';
        tableDiv.innerHTML = this._createDataTable(data, fields);
        messageDiv.appendChild(tableDiv);
      }
      
      this._messagesContainer.appendChild(messageDiv);
      
      // Add click handlers for drill-down (no timeout needed - handled internally)
      this._addDrillDownHandlers(data, fields);
      
      this._scrollToBottom();
    }

    _createDataTable(data, fields) {
      if (!data || data.length === 0) return '';
      
      // Show only first 5 records and key fields to avoid overwhelming the UI
      const displayData = data.slice(0, 5);
      
      // Define key fields based on the entity type
      let keyFields = [];
      if (fields.includes('GLAccount') || fields.includes('AmountInTransactionCurrency') || fields.includes('AmountInFreeDefinedCurrency1')) {
        // GL Account Line Item fields
        keyFields = [
          'GLAccount', 
          'AmountInFreeDefinedCurrency1',  // Primary amount field (maps to OSL in ACDOCA)
          'AmountInTransactionCurrency', 
          'CompanyCode', 
          'FiscalYear', 
          'PostingDate', 
          'DebitCreditCode',
          'AccountingDocument',
          'CostCenter',
          'ProfitCenter'
        ];
      } else if (fields.includes('BusinessPartner') || fields.includes('Customer')) {
        // Business Partner fields
        keyFields = [
          'BusinessPartner', 
          'BusinessPartnerName', 
          'BusinessPartnerFullName', 
          'Customer', 
          'BusinessPartnerCategory'
        ];
      } else {
        // Generic fields - show first 8 available fields
        keyFields = fields.slice(0, 8);
      }
      
      const displayFields = keyFields.filter(field => fields.includes(field));
      
      let tableHTML = `
        <div class="data-table">
          <h4>📋 Data Preview (showing ${displayData.length} of ${data.length} records)</h4>
          <table class="data-table-content">
            <thead>
              <tr>
                ${displayFields.map(field => `<th>${field}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `;
      
      displayData.forEach((record, index) => {
        tableHTML += `<tr class="data-row" data-record-index="${index}" style="cursor: pointer;">`;
        displayFields.forEach(field => {
          const value = record[field] || '';
          tableHTML += `<td>${this._formatCellValue(value, field)}</td>`;
        });
        tableHTML += '</tr>';
      });
      
      tableHTML += `
            </tbody>
          </table>
          ${data.length > 5 ? `<p class="data-note">... and ${data.length - 5} more records</p>` : ''}
        </div>
      `;
      
      return tableHTML;
    }

    _hasMeaningfulData(value) {
      // Check for null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return false;
      }
      
      // Check for boolean false (might be meaningful in some contexts, but often indicates "no data")
      if (value === false) {
        return false;
      }
      
      // Check for zero (might be meaningful for amounts, but often indicates "no data")
      if (value === 0) {
        return false;
      }
      
      // Check for empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      
      // Check for empty objects
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        return false;
      }
      
      // Check for strings that are just whitespace
      if (typeof value === 'string' && value.trim() === '') {
        return false;
      }
      
      // Check for common "empty" values in SAP systems (but be less restrictive)
      const emptyValues = ['00000000', '0000000000', '0000', 'N', 'No', 'NO'];
      if (emptyValues.includes(String(value))) {
        return false;
      }
      
      // For material APIs, be more permissive with numeric values
      // Only filter out truly empty patterns, not valid numeric codes
      
      return true;
    }

    _formatCellValue(value, fieldName = '') {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      
      const stringValue = String(value);
      
      // Special formatting for GL Account fields
      if (fieldName === 'AmountInFreeDefinedCurrency1' || fieldName === 'AmountInTransactionCurrency' || fieldName === 'AmountInCompanyCodeCurrency' || fieldName === 'AmountInGlobalCurrency') {
        // Format currency amounts
        const numValue = parseFloat(stringValue);
        if (!isNaN(numValue)) {
          return numValue.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        }
      } else if (fieldName === 'PostingDate' || fieldName === 'DocumentDate') {
        // Format dates
        try {
          const date = new Date(stringValue);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US');
          }
        } catch (e) {
          // Fall through to default formatting
        }
      } else if (fieldName === 'DebitCreditCode') {
        // Format debit/credit codes
        return stringValue === 'S' ? 'Debit' : stringValue === 'H' ? 'Credit' : stringValue;
      }
      
      // Default formatting - limit length but preserve important data
      const maxLength = fieldName.includes('Amount') ? 20 : 50;
      return stringValue.substring(0, maxLength) + (stringValue.length > maxLength ? '...' : '');
    }

    _addDrillDownHandlers(data, fields) {
      console.log('Adding drill-down handlers for', data.length, 'records');
      
      // Store data and fields for event delegation
      this._currentData = data;
      this._currentFields = fields;
      
      // Use event delegation instead of individual handlers
      this._setupEventDelegation();
    }

    _setupEventDelegation() {
      console.log('🔄 NEW VERSION 6.5.0: Setting up event delegation for drill-down');
      
      // Remove existing delegation handler if any
      if (this._delegationHandler) {
        this._shadowRoot.removeEventListener('click', this._delegationHandler);
      }
      
      // Create new delegation handler
      this._delegationHandler = (event) => {
        const row = event.target.closest('.data-row, tr[data-record-index]');
        if (!row) return;
        
        // Get the row index from data-record-index attribute
        const recordIndex = parseInt(row.getAttribute('data-record-index'));
        console.log('🆕 NEW DELEGATION: Row clicked, record index:', recordIndex);
        
        if (isNaN(recordIndex) || !this._currentData || !this._currentData[recordIndex]) {
          console.error('❌ NEW DELEGATION: Invalid record index or no data available:', recordIndex);
          console.log('Current data length:', this._currentData ? this._currentData.length : 'No data');
          return;
        }
        
        console.log('✅ NEW DELEGATION: Showing details for record', recordIndex);
        console.log('✅ NEW DELEGATION: Data available:', !!this._currentData[recordIndex]);
        
        // Use the new simplified modal approach
        this._showSimpleModal(this._currentData[recordIndex], this._currentFields);
      };
      
      // Attach delegation handler to shadow root
      this._shadowRoot.addEventListener('click', this._delegationHandler);
      console.log('✅ NEW VERSION 6.5.0: Event delegation set up successfully');
    }

    _showSimpleModal(record, fields) {
      console.log('Creating simple modal for record:', record);
      
      // Remove any existing modal
      const existingModal = this._shadowRoot.querySelector('.simple-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Create a very simple modal structure
      const modal = document.createElement('div');
      modal.className = 'simple-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      `;
      
      // Create modal content
      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 80%;
        max-height: 80%;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Create title
      const title = document.createElement('h3');
      title.textContent = '📋 Record Details';
      title.style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-size: 18px;
        border-bottom: 2px solid #007acc;
        padding-bottom: 10px;
      `;
      
      // Create content area
      const detailsDiv = document.createElement('div');
      detailsDiv.innerHTML = this._createSimpleRecordDetails(record, fields);
      
      // Assemble modal
      content.appendChild(closeBtn);
      content.appendChild(title);
      content.appendChild(detailsDiv);
      modal.appendChild(content);
      
      // Add to shadow root
      this._shadowRoot.appendChild(modal);
      
      // Add event listeners
      closeBtn.onclick = () => {
        console.log('Close button clicked');
        modal.remove();
      };
      
      modal.onclick = (e) => {
        if (e.target === modal) {
          console.log('Modal background clicked');
          modal.remove();
        }
      };
      
      console.log('Simple modal created and displayed');
    }

    _createSimpleRecordDetails(record, allFields) {
      if (!record) {
        return '<div class="error">No record data available</div>';
      }
      
      let html = '<div style="display: grid; gap: 10px;">';
      
      // Filter to only show fields with meaningful data
      const fieldsWithData = [];
      
      allFields.forEach(field => {
        try {
          const value = record[field];
          if (this._hasMeaningfulData(value)) {
            fieldsWithData.push({ field, value });
          }
        } catch (error) {
          console.error('Error accessing field', field, ':', error);
        }
      });
      
      // Show fields with data
      html += `<div style="margin-bottom: 15px; font-weight: bold; color: #007acc;">📊 Record Data (${fieldsWithData.length} fields)</div>`;
      
      fieldsWithData.forEach(({ field, value }) => {
        html += `
          <div style="display: flex; padding: 8px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold; min-width: 200px; color: #333;">${field}:</div>
            <div style="color: #666; word-break: break-all;">${this._formatCellValue(value, field)}</div>
          </div>
        `;
      });
      
      html += '</div>';
      return html;
    }

    // Event delegation is now handled in _setupEventDelegation()
    // Removed complex individual event handler management

    // Old complex modal code removed - using _showSimpleModal instead

    _createRecordDetailsHTML(record, allFields) {
      let html = '<div class="record-details">';
      
      // Add error handling for record access
      if (!record) {
        console.error('Record is null or undefined');
        return '<div class="error">No record data available</div>';
      }
      
      // Filter to only show fields with meaningful data
      const fieldsWithData = [];
      
      allFields.forEach(field => {
        try {
          const value = record[field];
          if (this._hasMeaningfulData(value)) {
            fieldsWithData.push({ field, value });
          }
        } catch (error) {
          console.error('Error accessing field', field, ':', error);
        }
      });
      
      // Only show fields with data
      html += `<div class="field-group"><h4>📊 Record Data (${fieldsWithData.length} fields)</h4>`;
      fieldsWithData.forEach(({ field, value }) => {
        html += `<div class="field-item"><strong>${field}:</strong> ${this._formatCellValue(value, field)}</div>`;
      });
      html += '</div>';
      
      html += '</div>';
      return html;
    }

    _addVisualizationButton(data, fields) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot';
      
      const buttonDiv = document.createElement('div');
      buttonDiv.className = 'visualization-container';
      buttonDiv.innerHTML = `
        <button class="visualize-btn" data-action="show-charts">
          📊 Visualize Data
        </button>
        <button class="visualize-btn" data-action="export-data">
          📥 Export Data
        </button>
      `;
      
      messageDiv.appendChild(buttonDiv);
      this._messagesContainer.appendChild(messageDiv);
      
      // Add click handlers
      const chartBtn = buttonDiv.querySelector('[data-action="show-charts"]');
      const exportBtn = buttonDiv.querySelector('[data-action="export-data"]');
      
      chartBtn.addEventListener('click', () => this._showCharts(data, fields));
      exportBtn.addEventListener('click', () => this._exportData(data, fields));
      
      this._scrollToBottom();
    }

    _showCharts(data, fields) {
      // Create chart modal
      const modal = document.createElement('div');
      modal.className = 'record-modal-overlay';
      modal.innerHTML = `
        <div class="record-modal chart-modal">
          <div class="record-modal-header">
            <h3>📊 Data Visualization</h3>
            <button class="record-modal-close">&times;</button>
          </div>
          <div class="record-modal-content">
            <div class="chart-container">
              <canvas id="categoryChart" width="400" height="200"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="customerChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      `;
      
      this._shadowRoot.appendChild(modal);
      
      // Add close handlers with null checks
      const closeBtn = modal.querySelector('.record-modal-close');
      const overlay = modal.querySelector('.record-modal-overlay');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.remove());
      }
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) modal.remove();
        });
      }
      
      // Create charts with delay to ensure DOM is ready
      setTimeout(() => {
        this._createCharts(data, fields);
      }, 200);
    }

    _createCharts(data, fields) {
      if (!data || data.length === 0) {
        console.error('No data available for charts');
        return;
      }

      // Category Distribution Chart
      const categoryData = {};
      data.forEach(record => {
        const category = record.BusinessPartnerCategory || 'Unknown';
        categoryData[category] = (categoryData[category] || 0) + 1;
      });
      
      const categoryCtx = this._shadowRoot.getElementById('categoryChart');
      if (categoryCtx && Object.keys(categoryData).length > 0) {
        try {
          this._createSimpleChart(categoryCtx, {
            type: 'doughnut',
            data: {
              labels: Object.keys(categoryData),
              datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#0070f2', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8', '#fd7e14']
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Business Partner Categories'
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating category chart:', error);
          categoryCtx.parentElement.innerHTML = '<p>Error rendering category chart</p>';
        }
      } else {
        console.error('Category chart canvas not found or data is empty');
        if (categoryCtx) {
          categoryCtx.parentElement.innerHTML = '<p>No category data available</p>';
        }
      }
      
      // Customer Distribution Chart
      const customerData = {};
      data.forEach(record => {
        const customer = record.Customer ? 'Has Customer ID' : 'No Customer ID';
        customerData[customer] = (customerData[customer] || 0) + 1;
      });
      
      const customerCtx = this._shadowRoot.getElementById('customerChart');
      if (customerCtx && Object.keys(customerData).length > 0) {
        try {
          this._createSimpleChart(customerCtx, {
            type: 'bar',
            data: {
              labels: Object.keys(customerData),
              datasets: [{
                label: 'Count',
                data: Object.values(customerData),
                backgroundColor: '#0070f2'
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Customer ID Distribution'
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating customer chart:', error);
          customerCtx.parentElement.innerHTML = '<p>Error rendering customer chart</p>';
        }
      } else {
        console.error('Customer chart canvas not found or data is empty');
        if (customerCtx) {
          customerCtx.parentElement.innerHTML = '<p>No customer data available</p>';
        }
      }
    }

    _createSimpleChart(canvas, config) {
      // Simple chart implementation without external library
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (config.type === 'doughnut') {
        this._drawDoughnutChart(ctx, config, width, height);
      } else if (config.type === 'bar') {
        this._drawBarChart(ctx, config, width, height);
      }
    }

    _drawDoughnutChart(ctx, config, width, height) {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;
      
      const data = config.data.datasets[0].data;
      const labels = config.data.labels;
      const colors = config.data.datasets[0].backgroundColor;
      
      const total = data.reduce((sum, val) => sum + val, 0);
      let currentAngle = -Math.PI / 2;
      
      data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        // Draw label
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${labels[index]}: ${value}`, labelX, labelY);
        
        currentAngle += sliceAngle;
      });
    }

    _drawBarChart(ctx, config, width, height) {
      const data = config.data.datasets[0].data;
      const labels = config.data.labels;
      const maxValue = Math.max(...data);
      
      const barWidth = width / labels.length * 0.8;
      const barSpacing = width / labels.length * 0.2;
      
      data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (height - 60);
        const x = index * (barWidth + barSpacing) + barSpacing / 2;
        const y = height - barHeight - 30;
        
        // Draw bar
        ctx.fillStyle = '#0070f2';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, height - 10);
        ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
      });
    }

    _exportData(data, fields) {
      if (!data || data.length === 0) {
        this._addMessage('❌ No data to export', 'bot error');
        return;
      }

      // Get all unique fields from all records
      const allFields = new Set();
      data.forEach(record => {
        Object.keys(record).forEach(field => allFields.add(field));
      });
      
      // Convert to array and sort for consistent ordering
      const sortedFields = Array.from(allFields).sort();
      
      // Create CSV content with proper escaping
      const headers = sortedFields.map(field => `"${field.replace(/"/g, '""')}"`).join(',');
      const rows = data.map(record => 
        sortedFields.map(field => {
          const value = record[field];
          if (value === null || value === undefined) {
            return '""';
          }
          const stringValue = value.toString();
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sap_data_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show confirmation with details
      this._addMessage(`📥 Data exported successfully! ${data.length} records with ${sortedFields.length} fields`, 'bot');
    }

    _addLoadingIndicator() {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading-indicator';
      loadingDiv.className = 'message bot';
      loadingDiv.innerHTML = `
        <div class="loading">
          <span>Thinking</span>
          <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      `;
      this._messagesContainer.appendChild(loadingDiv);
      this._scrollToBottom();
    }

    _removeLoadingIndicator() {
      const loadingDiv = this._shadowRoot.getElementById('loading-indicator');
      if (loadingDiv) {
        loadingDiv.remove();
      }
    }

    _updateStatus(status) {
      this._status.textContent = status;
    }

    _scrollToBottom() {
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
    }

    // Public methods callable from SAC
    sendQuery(query) {
      this._inputField.value = query;
      this._handleSend();
    }

    clearChat() {
      this._messagesContainer.innerHTML = '';
      this._addMessage('Chat cleared. How can I help you?', 'bot');
    }

    // Property getters/setters
    get apiEndpoint() {
      return this._apiEndpoint;
    }

    set apiEndpoint(value) {
      this._apiEndpoint = value;
    }

    get apiKey() {
      return this._apiKey;
    }

    set apiKey(value) {
      this._apiKey = value;
    }
  }

  // Prevent duplicate registration
  if (!customElements.get('sap-chatbot-widget')) {
    customElements.define('sap-chatbot-widget', SAPChatbotWidget);
  }
})();

