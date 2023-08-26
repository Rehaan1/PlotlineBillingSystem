const fs = require("fs")
const path = require('path')
const PDFDocument = require("pdfkit")

async function createInvoice(invoice, path) {
    let doc = new PDFDocument({ size: "A4", margin: 50 })

    generateHeader(doc)
    generateCustomerInformation(doc, invoice)
    generateInvoiceTable(doc, invoice)
    generateFooter(doc)

    try {
        await new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(path)

            doc.pipe(writeStream)

            doc.end()

            writeStream.on('finish', () => {
                resolve()
            })

            writeStream.on('error', (error) => {
                reject(error)
            })
        })

        console.log('PDF created successfully.')
        return true

    } catch (error) {
        console.error('Error creating PDF:', error)
        return false
    }

}

function generateHeader(doc) {

    const f1 = path.join(__dirname, 'fonts', 'Roboto-Light.ttf')
    const f2 = path.join(__dirname, 'fonts', 'Roboto-Medium.ttf')

    doc.registerFont("Roboto", f1)
    doc.registerFont("Roboto-Bold", f2)
    const logoPath = path.join(__dirname, 'logo.png')

    doc.image(logoPath, 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(20)
        .text("Disrupt Tech.", 110, 57)
        .fontSize(10)
        .text("Disrupt Tech.", 200, 50, { align: "right" })
        .text("Horizon Avenue", 200, 65, { align: "right" })
        .text("Dubai Main Road, UAE, 500001", 200, 80, { align: "right" })
        .moveDown()
}

function generateCustomerInformation(doc, invoice) {
    doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160)

    generateHr(doc, 185)

    const customerInformationTop = 200

    doc.fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop)
        .font("Roboto-Bold")
        .text(invoice.invoice_nr, 150, customerInformationTop)
        .font("Roboto")
        .text("Invoice Date:", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Invoice Total:", 50, customerInformationTop + 30)
        .text(
            formatCurrency(invoice.subtotal),
            150,
            customerInformationTop + 30
        )

    generateHr(doc, 252)
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 330

    doc.font("Roboto-Bold")
    generateTableRow(
        doc,
        invoiceTableTop,
        "Item Name",
        "Item Type",
        "Unit Cost",
        "Quantity",
        "Sub Total"
    );
    generateHr(doc, invoiceTableTop + 20)
    doc.font("Roboto")

    let position = invoiceTableTop + 30;
    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i]
        item.price = parseFloat(item.price)
        item.totalItemValue = parseFloat(item.total_item_value)
        generateItemRow(
            doc,
            position,
            item.name,
            item.item_type,
            formatCurrency(item.price),
            item.quantity,
            formatCurrency(item.price * item.quantity),
            formatCurrency(parseFloat(item.tax_a)),
            formatCurrency(parseFloat(item.tax_b)),
            formatCurrency(parseFloat(item.tax_c)),
            formatCurrency(parseFloat(item.total_item_value))
        )

        generateHr(doc, position + 70)
        position += 85
    }

    const grandTotalPosition = position;
    doc.font("Roboto-Bold")
    generateTableRow(
        doc,
        grandTotalPosition,
        "",
        "",
        "Grand Total",
        "",
        formatCurrency(invoice.subtotal)
    );
    doc.font("Roboto")
}

function generateItemRow(
    doc,
    y,
    itemName,
    itemType,
    unitCost,
    quantity,
    subtotal,
    tax_a,
    tax_b,
    tax_c,
    totalItemValue
) {
    doc.fontSize(10)
        .text(itemName, 50, y)
        .text(itemType, 200, y)
        .text(unitCost, 280, y, { width: 90, align: "right" })
        .text(quantity, 370, y, { width: 90, align: "right" })
        .text(subtotal, 0, y, { align: "right" });
    doc.fontSize(10)
        .text("Tax A:", 370, y + 12, { width: 90, align: "right" })
        .text(tax_a, 0, y + 12, { align: "right" })
        .text("Tax B:", 370, y + 24, { width: 90, align: "right" })
        .text(tax_b, 0, y + 24, { align: "right" })
        .text("Tax C:", 370, y + 36, { width: 90, align: "right" })
        .text(tax_c, 0, y + 36, { align: "right" })

    doc.font("Roboto-Bold")
    doc.fontSize(10)
        .text("Item Total: ", 370, y + 55, { width: 90, align: "right" })
        .text(totalItemValue, 0, y + 55, { align: "right" })
    doc.font("Roboto")
}

function generateFooter(doc) {
    doc.fontSize(10).text(
        "This is a Computer generated invoice. Thank you for your business.",
        50,
        780,
        { align: "center", width: 500 }
    )
}

function generateTableRow(
    doc,
    y,
    item,
    description,
    unitCost,
    quantity,
    lineTotal
) {
    doc.fontSize(10)
        .text(item, 50, y)
        .text(description, 200, y)
        .text(unitCost, 280, y, { width: 90, align: "right" })
        .text(quantity, 370, y, { width: 90, align: "right" })
        .text(lineTotal, 0, y, { align: "right" })
}

function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke()
}

function formatCurrency(rupees) {
    return "₹" + rupees.toFixed(2)
}

function formatDate(date) {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    return year + "/" + month + "/" + day
}

module.exports = {
    createInvoice,
}
