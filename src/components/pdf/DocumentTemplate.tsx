import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { numberToWordsIndian } from '@/lib/number-to-words'

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
  },
  headerContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 5,
  },
  logoBox: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 80,
    height: 80,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  centerHeader: {
    alignItems: 'center',
    paddingLeft: 80, // Leave space for logo
    paddingRight: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#425C7A', // Slate Blue color matching the image
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  headerText: {
    fontSize: 9,
    marginBottom: 2,
    color: '#000000',
  },
  headerLine: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderBottomColor: '#425C7A',
    marginBottom: 15,
    marginTop: 5,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  topGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  topLeft: {
    width: '50%',
  },
  topRight: {
    width: '40%',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 65,
  },
  metaValue: {
    flex: 1,
  },
  subjectLine: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  subjectLabel: {
    fontFamily: 'Helvetica-Bold',
  },
  subjectValue: {
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableHeader: {
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontSize: 9,
    justifyContent: 'center',
  },
  colSr: { width: '8%', textAlign: 'center' },
  colDesc: { flex: 1 },
  colMake: { width: '12%', textAlign: 'center' },
  colQty: { width: '10%', textAlign: 'center' },
  colUnit: { width: '10%', textAlign: 'center' },
  colRate: { width: '14%', textAlign: 'center' },
  colAmt: { width: '16%', textAlign: 'center', borderRightWidth: 0 },

  colRateAlignRight: { width: '14%', textAlign: 'right' },
  colAmtAlignRight: { width: '16%', textAlign: 'right', borderRightWidth: 0 },

  totalRow: {
    flexDirection: 'row',
  },
  totalLabelBox: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalAmountBox: {
    width: '16%',
    padding: 5,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  termsBox: {
    marginBottom: 15,
  },
  signatureBlock: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  signatureBox: {
    alignItems: 'center',
  },
  stampImage: {
    width: 140,
    height: 60,
    objectFit: 'contain',
    marginVertical: 10,
  },
  companyStampImage: {
    width: 100,
    height: 100,
    objectFit: 'contain',
    marginRight: 10,
  },
  footerLine: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    right: 30,
    borderTopWidth: 1.5,
    borderTopColor: '#425C7A',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#000000',
  },
  footerLineText: {
    marginBottom: 5,
  }
})

export const DocumentTemplate = ({ document, settings, client, supplier, lines }: any) => {
  const isInvoice = document.type === 'invoice'
  const isPO = document.type === 'po'
  const isDC = document.type === 'dc'
  const isWCC = document.type === 'wcc'
  const isQuotation = document.type === 'quotation'

  const getTitle = () => {
    switch (document.type) {
      case 'quotation': return 'Quotation'
      case 'invoice': return 'TAX INVOICE'
      case 'dc': return 'Delivery challan'
      case 'po': return 'PURCHASE ORDER'
      case 'wcc': return 'WORK COMPLETION CERTIFICATE'
      default: return 'Document'
    }
  }

  const targetContact = isPO ? supplier : client

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header Block */}
        <View style={styles.headerContainer}>
          {settings.logo_url && (
            <View style={styles.logoBox}>
              <Image src={settings.logo_url} style={styles.logo} />
            </View>
          )}
          <View style={styles.centerHeader}>
            <Text style={styles.businessName}>{settings.business_name}</Text>
            <Text style={styles.headerText}>Mumbai Office: - {settings.mumbai_office_address}</Text>
            <Text style={styles.headerText}>
              Email ID- {document.type === 'invoice' ? settings.email_invoice : settings.email_other}, Contact no: - {settings.contact_numbers}
            </Text>
          </View>
        </View>

        <View style={styles.headerLine} />

        {/* Title */}
        <Text style={styles.title}>{getTitle()}</Text>
        {isWCC && (
          <Text style={{ textAlign: 'center', fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 20, fontSize: 12 }}>TO WHOM SO EVER IT MAY CONCERN</Text>
        )}

        {/* Top Details Grid */}
        <View style={styles.topGrid}>
          {/* Left Side (To Address) */}
          <View style={[styles.topLeft, isWCC ? { width: '100%' } : {}]}>
            {!isPO && !isWCC && (
              <>
                <Text style={{ marginBottom: 3 }}>{isInvoice ? 'Bill to,' : isDC ? 'Ship To,' : 'To,'}</Text>
                {client?.name && <Text style={{ marginBottom: 2 }}>{client.name}</Text>}
                {client?.address && <Text style={{ marginBottom: 2 }}>{client.address}</Text>}
                {client?.gstin && <Text style={{ marginTop: 2 }}>{isInvoice ? 'GSTIN- ' : 'GSTIN: '}{client.gstin}</Text>}
                {client?.kind_attention && <Text style={{ marginBottom: 2 }}>{isInvoice ? 'Kind attention- ' : 'Kind Attention- '}{client.kind_attention}</Text>}
                {isInvoice && client?.email && <Text style={{ marginTop: 2 }}>Email Id- {client.email}</Text>}
              </>
            )}

            {isPO && (
              <>
                <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Supplier Name & Address: -</Text>
                {supplier?.name && <Text style={{ marginBottom: 2 }}>{supplier.name}</Text>}
                {supplier?.address && <Text style={{ marginBottom: 2 }}>{supplier.address}</Text>}
                {supplier?.gstin && <Text style={{ marginTop: 2 }}>GST No.: {supplier.gstin}</Text>}
              </>
            )}

            {isWCC && (
              <View style={{ marginBottom: 15 }}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 145 }]}>Name of Client: -</Text>
                  <Text style={styles.metaValue}>{client?.name}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 145 }]}>Name of work/Project:-</Text>
                  <Text style={styles.metaValue}>{document.subject}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 145 }]}>Work Order number: -</Text>
                  <Text style={styles.metaValue}>{document.reference_number || '-'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 145 }]}>Work Order date:-</Text>
                  <Text style={styles.metaValue}>{format(new Date(document.document_date), 'dd/MM/yyyy')}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 145 }]}>Work Order value:-</Text>
                  <Text style={styles.metaValue}>{document.metadata?.work_order_value || '-'}</Text>
                </View>
                <View style={[styles.metaRow, { marginTop: 15 }]}>
                  <Text style={[styles.metaLabel, { width: 145 }]}>Work Period:-</Text>
                  <Text style={styles.metaValue}>{document.metadata?.work_period || '-'}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Right Side (Dates & Refs) */}
          {!isWCC && (
            <View style={styles.topRight}>
              <>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, (isInvoice || isPO) ? { width: 85 } : isDC ? { width: 90 } : {}]}>{isPO ? 'Date-' : isInvoice ? 'Date-' : 'Date:'}</Text>
                  <Text style={styles.metaValue}>{(isInvoice || isPO) ? ' ' : '- '}{format(new Date(document.document_date), 'dd/MM/yyyy')}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, (isInvoice || isPO) ? { width: 85 } : isDC ? { width: 90 } : {}]}>{isPO ? 'PO number-' : isInvoice ? 'Invoice number:' : isDC ? 'DC challan no.:' : 'Quotation:'}</Text>
                  <Text style={styles.metaValue}>{(isInvoice || isPO) ? ' ' : '- '}{document.document_number}</Text>
                </View>
                {!isPO && document.reference_number && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, isInvoice ? { width: 105 } : isDC ? { width: 80 } : {}]}>{isInvoice ? `${client?.name?.split(' ')[0] || ''} PO number:` : isDC ? 'PO Number:' : 'Ref:'}</Text>
                    <Text style={styles.metaValue}>- {document.reference_number}</Text>
                  </View>
                )}

                {isPO && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Buyer Name & Address: -</Text>
                    <Text style={{ marginBottom: 2 }}>{settings.business_name},</Text>
                    <Text style={{ marginBottom: 2 }}>{settings.regd_office_address}</Text>
                    {settings.gstin && <Text style={{ marginTop: 2 }}>GSTIN: - {settings.gstin}</Text>}
                  </View>
                )}
              </>
            </View>
          )}
        </View>

        {/* Subject */}
        {document.subject && !isWCC && (
          <View style={styles.subjectLine}>
            <Text style={styles.subjectLabel}>{isInvoice ? '' : isDC ? 'Sub: - ' : 'Sub: '}</Text>
            <Text style={styles.subjectValue}>{document.subject}</Text>
          </View>
        )}

        {isWCC && <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>1. Material Installed</Text>}

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colSr]}>Sr.{"\n"}No.</Text>
            <Text style={[styles.tableCell, styles.colDesc, { textAlign: 'center' }]}>{isPO ? 'Material / services Description' : 'Description'}</Text>
            {isWCC && <Text style={[styles.tableCell, styles.colMake]}>Make</Text>}
            <Text style={[styles.tableCell, styles.colQty]}>{isWCC ? 'Qty' : 'Quantity'}</Text>
            {!isWCC && <Text style={[styles.tableCell, styles.colUnit]}>Unit</Text>}

            {/* Conditional Columns */}
            {!isDC && !isWCC && (
              <>
                <Text style={[styles.tableCell, styles.colRate]}>{(isInvoice || isPO) ? 'Rate (Rs. Per unit)' : 'Rate per\nunit (Rs.)'}</Text>
                <Text style={[styles.tableCell, styles.colAmt]}>{(isInvoice || isPO) ? 'Amount (Rs.)' : 'Total\nAmount\n(Rs.)'}</Text>
              </>
            )}
          </View>

          {/* Table Body */}
          {lines.map((line: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSr]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.colDesc, { textAlign: 'left' }]}>{line.description}</Text>
              {isWCC && <Text style={[styles.tableCell, styles.colMake]}>{line.make || '-'}</Text>}
              <Text style={[styles.tableCell, styles.colQty]}>{isWCC ? `${line.quantity} ${line.unit}` : line.quantity}</Text>
              {!isWCC && <Text style={[styles.tableCell, styles.colUnit]}>{line.unit}</Text>}

              {!isDC && !isWCC && (
                <>
                  <Text style={[styles.tableCell, styles.colRateAlignRight]}>{line.rate?.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.colAmtAlignRight]}>{line.amount?.toFixed(2)}</Text>
                </>
              )}
            </View>
          ))}

          {/* Table Footer Totals */}
          {!isDC && !isWCC && (
            <>
              {/* Subtotal Row */}
              <View style={[styles.totalRow, (isInvoice || isPO) ? { borderBottomWidth: 1, borderBottomColor: '#000000' } : {}]}>
                <View style={styles.totalLabelBox}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                    {(isInvoice || isPO) ? 'Total Amount (Rs.)' : 'Total Amount (Rs.)'}
                  </Text>
                </View>
                <Text style={styles.totalAmountBox}>{document.subtotal?.toFixed(2)}</Text>
              </View>

              {/* Tax Rows for Invoices / PO */}
              {(isInvoice || isPO) && (
                <>
                  <View style={[styles.totalRow, { borderBottomWidth: 1, borderBottomColor: '#000000' }]}>
                    <View style={styles.totalLabelBox}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                        {(isInvoice || isPO) ? `CGST (${lines?.[0]?.gst_rate ? lines[0].gst_rate / 2 : 9}%)` : 'Add: CGST'}
                      </Text>
                    </View>
                    <Text style={styles.totalAmountBox}>{document.cgst?.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.totalRow, { borderBottomWidth: 1, borderBottomColor: '#000000' }]}>
                    <View style={styles.totalLabelBox}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                        {(isInvoice || isPO) ? `SGST (${lines?.[0]?.gst_rate ? lines[0].gst_rate / 2 : 9}%)` : 'Add: SGST'}
                      </Text>
                    </View>
                    <Text style={styles.totalAmountBox}>{document.sgst?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <View style={styles.totalLabelBox}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                        {(isInvoice || isPO) ? 'Total Amount with taxes (Rs.)' : 'Grand Total Amount (Rs.)'}
                      </Text>
                    </View>
                    <Text style={styles.totalAmountBox}>{document.total?.toFixed(2)}</Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Delivery Information for PO */}
        {isPO && (
          <View style={{ marginBottom: 10 }}>
            {document.metadata?.delivery_location && <Text>Delivery location: - {document.metadata.delivery_location}</Text>}
            {document.metadata?.delivery_date && <Text>Delivery date: - {document.metadata.delivery_date}</Text>}
          </View>
        )}

        {/* Amount in Words */}
        {isInvoice && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Helvetica' }}>Amount in words- Rupees {numberToWordsIndian(document.total)} only.</Text>
          </View>
        )}
        {!isInvoice && !isPO && !isDC && !isWCC && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Amount in words:</Text>
            <Text>{numberToWordsIndian(document.total)}</Text>
          </View>
        )}

        {isWCC && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>2. Scope of Work Completed</Text>
            {document.metadata?.terms ? (
              <View style={{ marginLeft: 10 }}>
                {document.metadata.terms.split('\n').map((term: string, i: number) => (
                  term.trim() ? (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                      <Text style={{ width: 10 }}>•</Text>
                      <Text style={{ flex: 1 }}>{term.trim()}</Text>
                    </View>
                  ) : null
                ))}
              </View>
            ) : null}
          </View>
        )}

        {isWCC && (
          <View style={{ marginBottom: 40, marginTop: 10 }}>
            <Text style={{ marginBottom: 10 }}>This is to certify that {settings.business_name} Has successfully completed Electrical work as per the work order.</Text>
            <Text style={{ marginBottom: 15 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>The work is completed on </Text>
              {document.metadata?.completion_date || format(new Date(), 'dd/MM/yyyy')}
            </Text>
            <Text>Thank you and assuring you our best service always.</Text>
          </View>
        )}

        {/* Terms & Conditions */}
        {document.metadata?.terms && !isWCC && (
          <View style={styles.termsBox}>
            <Text style={{ fontFamily: isPO ? 'Helvetica' : 'Helvetica-Bold', marginBottom: 5 }}>{isPO ? 'Terms & conditions: -' : 'Terms & conditions:'}</Text>
            {isPO ? (
              <View style={{ marginLeft: 10 }}>
                {document.metadata.terms.split('\n').map((term: string, i: number) => (
                  term.trim() ? (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                      <Text style={{ width: 10 }}>•</Text>
                      <Text style={{ flex: 1 }}>{term.trim()}</Text>
                    </View>
                  ) : null
                ))}
              </View>
            ) : (
              <Text>{document.metadata.terms}</Text>
            )}
          </View>
        )}

        {/* Bank Details for Invoice */}
        {isInvoice && (
          <View style={{ marginBottom: 20, marginLeft: 20 }}>
            <Text style={{ fontFamily: 'Helvetica', marginBottom: 5 }}>Bank Account Details:</Text>
            <View style={{ marginLeft: 15 }}>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ width: 10 }}>•</Text>
                <Text>Bank Name: {settings.bank_name}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ width: 10 }}>•</Text>
                <Text>Account no: {settings.bank_account_no}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ width: 10 }}>•</Text>
                <Text>IFSC code : {settings.bank_ifsc}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Signatures */}
        {!isWCC && (
          <View style={styles.signatureBlock}>
            {settings.stamp_url && (
              <View style={{ justifyContent: 'center' }}>
                <Image src={settings.stamp_url} style={styles.companyStampImage} />
              </View>
            )}
            <View style={styles.signatureBox}>
              <Text style={{ marginBottom: 5 }}>Thanks &amp; Regards</Text>
              {settings.signature_url ? (
                <Image src={settings.signature_url} style={styles.stampImage} />
              ) : (
                <View style={{ height: 60 }} />
              )}
              <Text>{settings.business_name}</Text>
            </View>
          </View>
        )}

        {isWCC && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 40, alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              {settings.stamp_url && (
                <View style={{ marginRight: 15 }}>
                  <Image src={settings.stamp_url} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                </View>
              )}
              <View>
                <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>Regards,</Text>
                {settings.signature_url ? (
                  <Image src={settings.signature_url} style={{ width: 100, height: 50, objectFit: 'contain', marginVertical: 5 }} />
                ) : (
                  <View style={{ height: 60 }} />
                )}
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{settings.business_name}</Text>
              </View>
            </View>
            <View style={{ width: 200, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{client?.name ? `${client.name.split(',')[0].split(' ')[0]} Representative` : 'Client Representative'}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerLine} />
        <View style={styles.footer}>
          <Text style={styles.footerLineText}>Regd. office:- {settings.regd_office_address}</Text>
          <Text>GSTIN :- {settings.gstin}</Text>
        </View>
      </Page>
    </Document>
  )
}
