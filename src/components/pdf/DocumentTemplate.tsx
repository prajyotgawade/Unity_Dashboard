import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { numberToWordsIndian } from '@/lib/number-to-words'

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937', // gray-800
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 100,
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  businessName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a', // Deep Blue
    marginBottom: 4,
  },
  headerText: {
    fontSize: 9,
    marginBottom: 2,
    color: '#4b5563',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textDecoration: 'underline',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    fontSize: 9,
  },
  colSr: { width: '8%' },
  colDesc: { flex: 1 },
  colQty: { width: '12%', textAlign: 'right' },
  colUnit: { width: '12%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmt: { width: '20%', textAlign: 'right' },
  colMake: { width: '15%' },
  
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalsBox: {
    width: '40%',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  totalLabel: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    width: '40%',
    textAlign: 'right',
  },
  bankDetails: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    marginBottom: 20,
    width: '50%',
  },
  terms: {
    marginBottom: 40,
  },
  signatureBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    alignItems: 'center',
    width: 200,
  },
  stampImage: {
    width: 120,
    height: 80,
    objectFit: 'contain',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 10,
  },
})

export const DocumentTemplate = ({ document, settings, client, supplier, lines }: any) => {
  const isInvoiceOrPO = document.type === 'invoice' || document.type === 'po'
  const isQuotation = document.type === 'quotation'
  const isPO = document.type === 'po'
  const isDC = document.type === 'dc'
  const isWCC = document.type === 'wcc'

  const getTitle = () => {
    switch (document.type) {
      case 'quotation': return 'Quotation'
      case 'invoice': return 'TAX INVOICE'
      case 'dc': return 'Delivery Challan'
      case 'po': return 'PURCHASE ORDER'
      case 'wcc': return 'WORK COMPLETION CERTIFICATE'
      default: return 'Document'
    }
  }

  const targetContact = document.type === 'po' ? supplier : client

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.businessName}>{settings.business_name}</Text>
            <Text style={styles.headerText}>Mumbai Office: {settings.mumbai_office_address}</Text>
            <Text style={styles.headerText}>Contact no: {settings.contact_numbers}</Text>
            <Text style={styles.headerText}>Email: {document.type === 'invoice' ? settings.email_invoice : settings.email_other}</Text>
          </View>
          {settings.logo_url && (
            <View style={styles.headerRight}>
              <Image src={settings.logo_url} style={styles.logo} />
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{getTitle()}</Text>
          {isWCC && <Text style={{ fontSize: 10, marginTop: 4 }}>TO WHOM SO EVER IT MAY CONCERN</Text>}
        </View>

        {/* Meta Grid */}
        <View style={styles.metaGrid}>
          {isPO ? (
            <>
               <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Supplier Name & Address:</Text>
                  <Text>{supplier?.name}</Text>
                  <Text>{supplier?.address}</Text>
                  <Text>GST No: {supplier?.gstin || 'N/A'}</Text>
               </View>
               <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Buyer Name & Address:</Text>
                  <Text>{settings.business_name}</Text>
                  <Text>{settings.mumbai_office_address}</Text>
                  <Text>GSTIN: {settings.gstin}</Text>
               </View>
            </>
          ) : isWCC ? (
             <View style={styles.metaCol}>
                 <Text><Text style={styles.metaLabel}>Name of Client: </Text>{client?.name}</Text>
                 <Text><Text style={styles.metaLabel}>Name of work/Project: </Text>{document.subject || '-'}</Text>
                 <Text><Text style={styles.metaLabel}>Work Order Number: </Text>{document.reference_number || '-'}</Text>
                 <Text><Text style={styles.metaLabel}>Work Order Date: </Text>{format(new Date(document.document_date), 'dd/MM/yyyy')}</Text>
                 <Text><Text style={styles.metaLabel}>Work Order Value: </Text>{document.metadata?.work_order_value || '-'}</Text>
                 <Text><Text style={styles.metaLabel}>Work Period: </Text>{document.metadata?.work_period || '-'}</Text>
             </View>
          ) : (
            <>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>{document.type === 'invoice' ? 'Bill to:' : document.type === 'dc' ? 'Ship To:' : 'To:'}</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 2 }}>{client?.name}</Text>
                <Text>{client?.address}</Text>
                {client?.gstin && <Text>GSTIN: {client.gstin}</Text>}
                {client?.kind_attention && <Text>Kind Attention: {client.kind_attention}</Text>}
              </View>
              <View style={styles.metaCol}>
                <Text><Text style={styles.metaLabel}>No: </Text>{document.document_number}</Text>
                <Text><Text style={styles.metaLabel}>Date: </Text>{format(new Date(document.document_date), 'dd/MM/yyyy')}</Text>
                {document.reference_number && (
                  <Text><Text style={styles.metaLabel}>Ref: </Text>{document.reference_number}</Text>
                )}
              </View>
            </>
          )}
        </View>

        {document.subject && !isWCC && (
          <View style={{ marginBottom: 15 }}>
            <Text><Text style={styles.metaLabel}>Subject: </Text>{document.subject}</Text>
          </View>
        )}

        {isWCC && <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>1. Material Installed</Text>}

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colSr]}>Sr No</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>Description</Text>
            {isWCC && <Text style={[styles.tableCell, styles.colMake]}>Make</Text>}
            <Text style={[styles.tableCell, styles.colQty]}>Quantity</Text>
            <Text style={[styles.tableCell, styles.colUnit]}>Unit</Text>
            {!isDC && !isWCC && <Text style={[styles.tableCell, styles.colRate]}>Rate (Rs)</Text>}
            {!isDC && !isWCC && <Text style={[styles.tableCell, styles.colAmt, { borderRightWidth: 0 }]}>Amount (Rs)</Text>}
          </View>
          
          {lines.map((line: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSr]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>{line.description}</Text>
              {isWCC && <Text style={[styles.tableCell, styles.colMake]}>{line.make || '-'}</Text>}
              <Text style={[styles.tableCell, styles.colQty]}>{line.quantity}</Text>
              <Text style={[styles.tableCell, styles.colUnit]}>{line.unit}</Text>
              {!isDC && !isWCC && <Text style={[styles.tableCell, styles.colRate]}>{line.rate?.toFixed(2)}</Text>}
              {!isDC && !isWCC && <Text style={[styles.tableCell, styles.colAmt, { borderRightWidth: 0 }]}>{line.amount?.toFixed(2)}</Text>}
            </View>
          ))}
        </View>

        {isWCC && (
          <View style={{ marginBottom: 20 }}>
             <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>2. Scope of Work Completed</Text>
             <Text>{document.metadata?.terms || ''}</Text>
          </View>
        )}

        {/* Totals */}
        {!isDC && !isWCC && (
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              {isInvoiceOrPO && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{document.subtotal?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total CGST</Text>
                    <Text style={styles.totalValue}>{document.cgst?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total SGST</Text>
                    <Text style={styles.totalValue}>{document.sgst?.toFixed(2)}</Text>
                  </View>
                </>
              )}
              <View style={[styles.totalRow, { borderBottomWidth: 0, backgroundColor: '#f3f4f6' }]}>
                <Text style={styles.totalLabel}>Grand Total (Rs)</Text>
                <Text style={styles.totalValue}>{document.total?.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Amount in words */}
        {document.type === 'invoice' && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Amount in words:</Text>
            <Text>{numberToWordsIndian(document.total)}</Text>
          </View>
        )}

        {/* Bank Details */}
        {document.type === 'invoice' && (
          <View style={styles.bankDetails}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>Bank Account Details:</Text>
            <Text>Bank Name: {settings.bank_name}</Text>
            <Text>Account No: {settings.bank_account_no}</Text>
            <Text>IFSC Code: {settings.bank_ifsc}</Text>
          </View>
        )}

        {/* PO Delivery Details */}
        {isPO && (
          <View style={{ marginBottom: 20 }}>
            <Text><Text style={styles.metaLabel}>Delivery Location: </Text>{document.metadata?.delivery_location || '-'}</Text>
            <Text><Text style={styles.metaLabel}>Delivery Date: </Text>{document.metadata?.delivery_date ? format(new Date(document.metadata.delivery_date), 'dd/MM/yyyy') : '-'}</Text>
          </View>
        )}

        {/* Terms */}
        {document.metadata?.terms && !isWCC && (
          <View style={styles.terms}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>Terms &amp; Conditions:</Text>
            <Text>{document.metadata.terms}</Text>
          </View>
        )}

        {isWCC && (
          <View style={{ marginBottom: 20 }}>
             <Text>This is to certify that Unity Enterprises has successfully completed work as per the work order.</Text>
             <Text style={{ marginTop: 5 }}>The work is completed on {format(new Date(), 'dd/MM/yyyy')}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={{ marginBottom: 40, fontFamily: 'Helvetica-Bold' }}>{isWCC ? 'Unity Enterprises' : 'Receiver\'s Signature'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ marginBottom: 5 }}>Thanks &amp; Regards,</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>For {settings.business_name}</Text>
            {settings.signature_url && (
              <Image src={settings.signature_url} style={styles.stampImage} />
            )}
            <Text>Authorised Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Regd. office: {settings.regd_office_address}  |  GSTIN: {settings.gstin}
        </Text>
      </Page>
    </Document>
  )
}
