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

// ─── Generate PDF buffer ──────────────────────────────────────────────────────
async function generateReceiptPdf(orderData) {
    const html = renderReceiptHtml(orderData);

    // Dynamic import for puppeteer (heavy dependency)
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });
        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}

module.exports = {
    getOrderDataForReceipt,
    renderReceiptHtml,
    generateReceiptPdf,
    amountToWords,
    formatDate,
    generateReceiptNo
};
