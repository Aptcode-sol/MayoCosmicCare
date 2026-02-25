const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const prisma = require('../prismaClient');

// ─── Number-to-words helper ───────────────────────────────────────────────────
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(num) {
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);

    let words = '';
    if (Math.floor(num / 10000000) > 0) {
        words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
        words += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
    }
    if (num > 0) {
        if (words !== '') words += 'and ';
        if (num < 20) {
            words += ones[num];
        } else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) words += ' ' + ones[num % 10];
        }
    }
    return words.trim();
}

function amountToWords(amount) {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let result = numberToWords(rupees) + ' Rupees';
    if (paise > 0) {
        result += ' and ' + numberToWords(paise) + ' Paise';
    } else {
        result += ' Only';
    }
    return result;
}

// ─── Template compilation ─────────────────────────────────────────────────────
const templatePath = path.join(__dirname, '../templates/receipt.hbs');
let compiledTemplate = null;

function getCompiledTemplate() {
    if (!compiledTemplate) {
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        compiledTemplate = Handlebars.compile(templateSource);
    }
    return compiledTemplate;
}

// ─── Format date as DD-MMM-YYYY ───────────────────────────────────────────────
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

// ─── Generate receipt number from order ID ────────────────────────────────────
function generateReceiptNo(orderId, createdAt) {
    const year = new Date(createdAt).getFullYear();
    const shortId = orderId.slice(-8).toUpperCase();
    return `MCC${year}${shortId}`;
}

// ─── Fetch order data and format for receipt ──────────────────────────────────
async function getOrderDataForReceipt(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: {
                include: { product: true }
            }
        }
    });

    if (!order) throw new Error('Order not found');
    if (order.status !== 'PAID') throw new Error('Receipt only available for paid orders');

    const receiptData = {
        receiptNo: generateReceiptNo(order.id, order.createdAt),
        date: formatDate(order.createdAt),
        paymentDate: formatDate(order.createdAt),
        customerName: order.user.name || order.user.username,
        userId: order.user.username,
        totalAmount: order.totalAmount.toLocaleString('en-IN'),
        amountInWords: amountToWords(order.totalAmount),
        items: order.items.map((item, idx) => ({
            index: idx + 1,
            name: item.product.name,
            quantity: item.quantity,
            price: item.price.toLocaleString('en-IN'),
            total: (item.price * item.quantity).toLocaleString('en-IN')
        })),
        contactEmail: process.env.EMAIL_USER || 'info@mayocosmiccare.com',
        companyAddress: 'Mayo Cosmic Care Pvt. Ltd.',
        gstNo: process.env.GST_NO || null
    };

    return receiptData;
}

// ─── Render HTML from template ────────────────────────────────────────────────
function renderReceiptHtml(orderData) {
    const template = getCompiledTemplate();
    return template(orderData);
}

// ─── Font paths ───────────────────────────────────────────────────────────────
const FONTS_DIR = path.join(__dirname, '../fonts');
const FONT_REGULAR = path.join(FONTS_DIR, 'Inter-Regular.ttf');
const FONT_BOLD = path.join(FONTS_DIR, 'Inter-Bold.ttf');
const FONT_SEMIBOLD = path.join(FONTS_DIR, 'Inter-SemiBold.ttf');
const FONT_ITALIC = path.join(FONTS_DIR, 'Inter-Italic.ttf');

// ─── Generate PDF buffer using PDFKit with Inter fonts ────────────────────────
async function generateReceiptPdf(orderData) {
    const PDFDocument = require('pdfkit');

    // Calculate content height first, then create doc with custom page size
    // We'll use a reasonable estimate and the page will fit the content
    const pageWidth = 595;
    const estimatedHeight = 530 + (orderData.items.length * 40) + (orderData.gstNo ? 60 : 0);

    const doc = new PDFDocument({
        size: [pageWidth, estimatedHeight],
        margin: 0,
        compress: true
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Register Inter fonts
    doc.registerFont('Inter', FONT_REGULAR);
    doc.registerFont('Inter-Bold', FONT_BOLD);
    doc.registerFont('Inter-SemiBold', FONT_SEMIBOLD);
    doc.registerFont('Inter-Italic', FONT_ITALIC);

    // pageWidth already defined above
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;

    // ─── HEADER with dark blue background ────────────────────────────────────
    doc.rect(0, 0, pageWidth, 80).fill('#0f172a');

    doc.fontSize(24).font('Inter-Bold').fillColor('#ffffff')
        .text('Mayo Cosmic Care', margin, 28, { width: 350 });

    // Receipt badge
    const badgeX = pageWidth - margin - 120;
    const badgeY = 22;
    doc.save();
    doc.rect(badgeX, badgeY, 120, 38);
    doc.fillOpacity(0.12).fill('#ffffff');
    doc.restore();
    doc.save();
    doc.rect(badgeX, badgeY, 120, 38);
    doc.strokeOpacity(0.25).strokeColor('#ffffff').lineWidth(1).stroke();
    doc.restore();
    doc.fillOpacity(1).strokeOpacity(1);
    doc.fontSize(18).font('Inter-Bold').fillColor('#ffffff')
        .text('RECEIPT', badgeX, badgeY + 11, { width: 120, align: 'center' });

    // ─── META ROW (Date, Receipt No & User ID) ─────────────────────────────
    let y = 80;
    doc.rect(0, y, pageWidth, 42).fill('#f8fafc');
    doc.strokeColor('#e2e8f0').lineWidth(1);
    doc.moveTo(0, y + 42).lineTo(pageWidth, y + 42).stroke();

    y += 14;
    doc.fontSize(12).fillColor('#64748b').font('Inter')
        .text('Date : ', margin, y, { continued: true })
        .font('Inter-Bold').fillColor('#0f172a')
        .text(orderData.date);

    // Receipt No in center-left area
    doc.fontSize(12).fillColor('#64748b').font('Inter')
        .text('Receipt No : ', pageWidth / 2 - 100, y, { continued: true })
        .font('Inter-Bold').fillColor('#0f172a')
        .text(orderData.receiptNo);

    // User ID on the right
    doc.fontSize(12).fillColor('#64748b').font('Inter')
        .text('User ID : ', pageWidth - margin - 140, y, { continued: true })
        .font('Inter-Bold').fillColor('#0f172a')
        .text(orderData.userId);

    // ─── BODY ────────────────────────────────────────────────────────────────
    y = 142;
    doc.fillColor('#475569').fontSize(13).font('Inter')
        .text('Received With Thanks From : ', margin, y, { continued: true })
        .font('Inter-Bold').fillColor('#0f172a')
        .text(orderData.customerName);

    // ─── DESCRIPTION BOX ─────────────────────────────────────────────────────
    y += 28;
    const descBoxHeight = 105;
    doc.rect(margin, y, contentWidth, descBoxHeight).fill('#f1f5f9');
    doc.strokeColor('#e2e8f0').rect(margin, y, contentWidth, descBoxHeight).stroke();

    const descPadding = 16;
    const descTextWidth = contentWidth - 2 * descPadding;

    doc.fontSize(11.5).fillColor('#334155').font('Inter')
        .text('The Amount Of ', margin + descPadding, y + 14, { continued: true })
        .font('Inter-Bold').text(`₹${orderData.totalAmount} /-`, { continued: true })
        .font('Inter').text(' is received against Purchase Order for Mayo Cosmic Care Mattress. The Purchase Order Amount is ', { continued: true })
        .font('Inter-Bold').text('Non Transferable', { continued: true })
        .font('Inter').text(' and ', { continued: true })
        .font('Inter-Bold').text('Non Refundable', { continued: true })
        .font('Inter').text(' and will be adjusted against your Final Payment for the product.', {
            width: descTextWidth,
            align: 'left',
            lineGap: 4
        });

    doc.fontSize(11).fillColor('#334155').font('Inter-Bold')
        .text('Please Note : ', margin + descPadding, y + 68, { continued: true })
        .font('Inter')
        .text('Your order will be processed and dispatched within 7-10 business days from the payment date.', {
            width: descTextWidth,
            lineGap: 3
        });

    // ─── ITEMS TABLE ─────────────────────────────────────────────────────────
    y += descBoxHeight + 14;

    // Table header with dark background
    doc.rect(margin, y, contentWidth, 30).fill('#0f172a');
    doc.fontSize(10).font('Inter-SemiBold').fillColor('#ffffff');
    doc.text('#', margin + 12, y + 10, { width: 25 });
    doc.text('PRODUCT', margin + 45, y + 10, { width: 200 });
    doc.text('QTY', margin + 255, y + 10, { width: 50, align: 'center' });
    doc.text('PRICE (₹)', margin + 320, y + 10, { width: 80, align: 'right' });
    doc.text('TOTAL (₹)', margin + 415, y + 10, { width: 100, align: 'right' });

    y += 30;

    // Table rows with proper padding
    orderData.items.forEach((item, idx) => {
        if (idx > 0) {
            doc.strokeColor('#f1f5f9').lineWidth(1)
                .moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
        }
        y += 16;
        doc.fontSize(12).fillColor('#334155').font('Inter');
        doc.text(item.index.toString(), margin + 12, y, { width: 25 });
        doc.text(item.name, margin + 45, y, { width: 200 });
        doc.text(item.quantity.toString(), margin + 255, y, { width: 50, align: 'center' });
        doc.text(item.price, margin + 320, y, { width: 80, align: 'right' });
        doc.text(item.total, margin + 415, y, { width: 100, align: 'right' });
        y += 24;
    });

    // Total row separator
    doc.strokeColor('#e2e8f0').lineWidth(2)
        .moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
    y += 2;
    doc.rect(margin, y, contentWidth, 30).fill('#f8fafc');
    doc.fontSize(13).font('Inter-Bold').fillColor('#0f172a');
    doc.text('Grand Total', margin + 12, y + 9);
    doc.text(`₹${orderData.totalAmount}/-`, margin + 415, y + 9, { width: 100, align: 'right' });

    // ─── GST BOX (directly below Grand Total, same color) ─────────────────────
    y += 38;
    if (orderData.gstNo) {
        doc.rect(margin, y, contentWidth, 50).fill('#f8fafc');
        doc.strokeColor('#e2e8f0').rect(margin, y, contentWidth, 50).stroke();
        doc.fontSize(14).font('Inter-Bold').fillColor('#0f172a')
            .text(`GST NO: ${orderData.gstNo}`, margin + 16, y + 10);
        doc.fontSize(10).font('Inter').fillColor('#64748b')
            .text('Please Note GST Invoice Will be Generated for the P.O. Amount On Purchase of Product.',
                margin + 16, y + 30, { width: contentWidth - 32 });
        y += 58;
    }

    // ─── TERMS & CONDITIONS (full width) ─────────────────────────────────────
    y += 10;
    doc.rect(margin, y, contentWidth, 80).fill('#f0f9ff');
    doc.strokeColor('#bae6fd').rect(margin, y, contentWidth, 80).stroke();
    doc.fontSize(10).font('Inter-Bold').fillColor('#075985')
        .text('TERMS & CONDITIONS', margin + 16, y + 12);
    doc.fontSize(10).font('Inter').fillColor('#0c4a6e')
        .text('By proceeding with the payment, the customer agrees to these terms and conditions. The purchase amount is non-refundable and non-transferable. Products will be delivered as per our standard delivery policy. For any queries, please contact our support team.',
            margin + 16, y + 28, { width: contentWidth - 32, lineGap: 3 });

    // ─── COMPUTER GENERATED NOTE ─────────────────────────────────────────────
    y += 90;
    doc.fontSize(9).font('Inter-Italic').fillColor('#94a3b8')
        .text('* This is a computer generated statement, hence signature is not required.',
            margin, y, { width: contentWidth });

    // ─── FOOTER with dark blue background ────────────────────────────────────
    y += 24;
    doc.rect(0, y, pageWidth, 50).fill('#0f172a');

    const footerLine = `Website : www.mayocosmiccare.com  |  Email : ${orderData.contactEmail}`;
    doc.fontSize(11).font('Inter').fillColor('#e2e8f0')
        .text(footerLine, 0, y + 12, {
            width: pageWidth,
            align: 'center'
        });

    doc.fontSize(9).font('Inter').fillColor('#94a3b8')
        .text(orderData.companyAddress.toUpperCase(), 0, y + 32, {
            width: pageWidth,
            align: 'center'
        });

    doc.end();

    return new Promise((resolve) => {
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
    });
}

module.exports = {
    getOrderDataForReceipt,
    renderReceiptHtml,
    generateReceiptPdf,
    amountToWords,
    formatDate,
    generateReceiptNo
};
