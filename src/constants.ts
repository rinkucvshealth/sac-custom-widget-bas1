// Service whitelist - Update with your available SAP services
export const SERVICE_WHITELIST = [
  // Services that exist on your SAP system (confirmed working)
  'API_BUSINESS_PARTNER',
  'API_CUSTOMER_RETURNS_DELIVERY_SRV',
  'API_GLACCOUNTLINEITEM',
  // Material and Inventory Management APIs
  'API_MATERIAL_DOCUMENT_SRV',
  'API_CUSTOMER_MATERIAL_SRV',
  'MMIM_MATERIAL_DATA_SRV',
  // Additional accessible services (confirmed 200 on $metadata)
  'API_PURCHASEORDER_PROCESS_SRV',
  'API_SALES_ORDER_SRV',
  'API_BILLING_DOCUMENT_SRV',
  'API_CREDIT_MEMO_REQUEST_SRV',
  'API_CUSTOMER_RETURN_SRV',
  'UI_MATERIALSERIALNUMBER',
  'MM_SUPPLIER_INVOICE_MANAGE',
  
  // Requires additional authorization (403 on $metadata)
  // 'API_INBOUND_DELIVERY_SRV',
  // 'API_OUTBOUND_DELIVERY_SRV',
];

// Add more services as your SAP admin grants permissions
  // 'ZAPI_CLFN_PRODUCT_SRV',
  // 'ZAPI_COMPANYCODE_SRV',
  // 'ZAPI_COSTCENTER_SRV',
  // 'ZAPI_CREDIT_MEMO_REQUEST_SRV',
  // 'ZAPI_CUSTOMER_MATERIAL_SRV',
  // 'ZAPI_CUSTOMER_RETURN_SRV',
  // 'ZAPI_EQUIPMENT',
  // 'ZAPI_GLACCOUNTINCHARTOFACCOUNTS_SRV',
  // 'ZAPI_GLACCOUNTLINEITEM',
  // 'ZAPI_INBOUND_DELIVERY_SRV',
  // 'ZAPI_INTERNALORDER_SRV',
  // 'ZAPI_JOURNALENTRYITEMBASIC_SRV',
  // 'ZAPI_MATERIAL_DOCUMENT_SRV',
  // 'ZAPI_OUTBOUND_DELIVERY_SRV',
  // 'ZAPI_PRODUCTGROUP_SRV',
  // 'ZAPI_PRODUCTION_ORDER_2_SRV',
  // 'ZAPI_PROFITCENTER_SRV',
  // 'ZAPI_PURCHASEORDER_PROCESS_SRV',
  // 'ZAPI_PURCHASEREQ_PROCESS_SRV',
  // 'ZAPI_PURGPRICINGCONDITIONTYPE_SRV',
  // 'ZAPI_SALES_ORDER_WITHOUT_CHARGE_SRV',
  // 'ZAPI_SALES_SCHEDULING_AGREEMENT',
  // 'ZAPI_SALESORGANIZATION_SRV',
  // 'ZAPI_SLSPRICINGCONDITIONRECORD_SRV',
  // 'ZAPI_SLSPRICINGCONDITIONTYPE_SRV',
  // 'ZAPI_WAREHOUSE',
  // 'ZAPI_WHSE_INBOUND_DELIVERY',
  // 'ZAPI_WHSE_OUTB_DLV_ORDER',
  // 'ZATP_ABC_ALTERNATIVE_CTRL_GROUP',
  // 'ZATP_ABC_STRATEGY',
  // 'ZATP_ASSGPRODTOPRODALLOC',
  // 'ZATP_BOP_CUSTOMSORT_SETUP',
  // 'ZATP_BOP_SEGMENT_SETUP',
  // 'ZATP_BOP_VARIANT_SETUP',
  // 'ZATP_CONFIGUREPRODALLOC',
  // 'ZATP_MANCHARCCATALOG',
  // 'ZATP_MANPRODALLOCPLNGDATA',
  // 'ZATP_MANPRODALLOCSEQUENCE',
  // 'ZATP_MONALLOCCOMBNCHGS',
  // 'ZATP_MONALLOCOBJCHGS',
  // 'ZATP_MONALLOCSQNCCHGS',
  // 'ZATP_MONCHARCVALCOMBN',
  // 'ZBILLOFMATERIALV2_SRV',
  // 'ZBOM_COMPARISON',
  // 'ZC_CONTRACT_FS_SRV',
  // ];

// Entity exclusions to avoid confusing results
export const ENTITY_EXCLUSIONS: { [key: string]: string[] } = {
  customer: ['A_CustomerSalesArea', 'A_CustomerCompany'],
  sales: ['A_SalesOrderHeaderPartner', 'A_SalesOrderHeaderPrcgElmnt'],
};

// Entity synonyms for better matching
export const ENTITY_SYNONYMS: { [key: string]: string[] } = {
  customer: ['businesspartner', 'bp', 'partner', 'business', 'client', 'businesspartner'],
  sales: ['salesorder', 'so', 'order'],
  product: ['material', 'item'],
  returns: ['return', 'customerreturn', 'deliveryreturn', 'returned', 'returnedgoods'],
  delivery: ['delivery', 'shipment', 'outbound', 'inbound', 'logistics'],
  returnsdelivery: ['returnsdelivery', 'returneddelivery', 'deliveryreturn', 'returnitem', 'returneditem'],
  glaccount: ['glaccount', 'glaccountlineitem', 'accountlineitem', 'accountline', 'glaccountline', 'general ledger', 'ledger', 'accounting', 'financial'],
  glaccountlineitem: ['glaccountlineitem', 'accountlineitem', 'accountline', 'glaccountline', 'glaccount', 'general ledger line item', 'ledger line item'],
  // Material and Inventory Management synonyms
  materialdocument: ['materialdocument', 'materialdoc', 'matdoc', 'inventorydocument', 'stockdocument', 'movementdocument', 'goodsreceipt', 'goodsissue', 'transfer'],
  customermaterial: ['customermaterial', 'customer material', 'customer-specific material', 'customer part', 'customer item', 'customer product'],
  materialmaster: ['materialmaster', 'material master', 'material data', 'material info', 'material information', 'inventory material', 'stock material', 'item master'],
  supplierinfo: ['supplierinfo', 'supplier info', 'supplier information', 'vendor info', 'vendor information', 'supplier data', 'vendor data']
};

// Known entities mapping for direct access
export const KNOWN_ENTITIES: { [key: string]: { service: string, entity: string, requiresParams?: boolean, mandatoryFilters?: string[] } } = {
  'A_BusinessPartner': { service: 'API_BUSINESS_PARTNER', entity: 'A_BusinessPartner' },
  'A_Customer': { service: 'API_BUSINESS_PARTNER', entity: 'A_Customer' },
  'A_BusinessPartnerAddress': { service: 'API_BUSINESS_PARTNER', entity: 'A_BusinessPartnerAddress' },
  'A_ReturnsDeliveryItem': { service: 'API_CUSTOMER_RETURNS_DELIVERY_SRV', entity: 'A_ReturnsDeliveryItem' },
  'GLAccountLineItem': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  // Add common entity name mappings
  'Customer': { service: 'API_BUSINESS_PARTNER', entity: 'A_Customer' },
  'BusinessPartner': { service: 'API_BUSINESS_PARTNER', entity: 'A_BusinessPartner' },
  'ReturnsDeliveryItem': { service: 'API_CUSTOMER_RETURNS_DELIVERY_SRV', entity: 'A_ReturnsDeliveryItem' },
  'GLAccount': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  'GLAccountLine': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  'AccountLineItem': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  // Material and Inventory Management entities
  'A_MaterialDocumentItem': { service: 'API_MATERIAL_DOCUMENT_SRV', entity: 'A_MaterialDocumentItem' },
  'A_CustomerMaterial': { service: 'API_CUSTOMER_MATERIAL_SRV', entity: 'A_CustomerMaterial' },
  'I_InvtryMgmtMatlMstrVH': { service: 'MMIM_MATERIAL_DATA_SRV', entity: 'I_InvtryMgmtMatlMstrVH' },
  'I_InvtryMgmtSuplrInfoRecdVH': { service: 'MMIM_MATERIAL_DATA_SRV', entity: 'I_InvtryMgmtSuplrInfoRecdVH' },
  // Common entity name mappings for materials
  'MaterialDocumentItem': { service: 'API_MATERIAL_DOCUMENT_SRV', entity: 'A_MaterialDocumentItem' },
  'CustomerMaterial': { service: 'API_CUSTOMER_MATERIAL_SRV', entity: 'A_CustomerMaterial' },
  'MaterialMaster': { service: 'MMIM_MATERIAL_DATA_SRV', entity: 'I_InvtryMgmtMatlMstrVH' },
  'SupplierInfo': { service: 'MMIM_MATERIAL_DATA_SRV', entity: 'I_InvtryMgmtSuplrInfoRecdVH' },
  // Sales and Revenue entities (common mappings)
  'Sales': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  'Revenue': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  'Product': { service: 'MMIM_MATERIAL_DATA_SRV', entity: 'I_InvtryMgmtMatlMstrVH' },
  'Products': { service: 'MMIM_MATERIAL_DATA_SRV', entity: 'I_InvtryMgmtMatlMstrVH' },
  // GL Account specific mappings for aggregations
  'GLAccountAmount': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
  'FiscalYear': { service: 'API_GLACCOUNTLINEITEM', entity: 'GLAccountLineItem' },
};

// Parameter-based API configurations
export const PARAMETER_BASED_APIS: { [key: string]: {
  service: string,
  entity: string,
  mandatoryFilters: string[],
  optionalFilters?: string[],
  description?: string,
  exampleQuery?: string,
  urlPattern?: 'function_import' | 'query_params'
} } = {
  'API_CUSTOMER_RETURNS_DELIVERY_SRV': {
    service: 'API_CUSTOMER_RETURNS_DELIVERY_SRV',
    entity: 'A_ReturnsDeliveryItem',
    mandatoryFilters: ['CustomerID'],
    optionalFilters: ['DeliveryDocument', 'Material', 'Plant'],
    description: 'Customer Returns Delivery - requires customer ID parameter',
    exampleQuery: 'Show me returns delivery items for customer 90000'
  }
};

// Commands
export const COMMANDS = {
  CLARIFY_SERVICE: 'clarify_service',
  SELECT_SERVICE: 'select_service',
  GET_DATA: 'get_data',
} as const;

export type CommandType = typeof COMMANDS[keyof typeof COMMANDS];

