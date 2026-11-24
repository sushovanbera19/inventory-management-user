/**
 * Builds the demo database: a fictional trading company with a year of believable history.
 * Everything is generated from a fixed random seed and placed relative to `now`, so the
 * charts always end today and every reload of a fresh seed looks the same.
 *
 * The history is internally consistent: each product's stock equals its last stock movement,
 * order totals follow calculateOrderTotals, timelines match statuses, purchase-order receipts
 * match their stock movements.
 */
import { addDays, addHours, addMinutes, format, startOfDay, subDays } from 'date-fns'
import { DEMO_CREDENTIALS } from '../../config/app.js'
import { calculateOrderTotals, calculatePurchaseTotals } from '../../lib/pricing.js'
import { roundMoney } from '../../lib/format.js'
import { newId } from './helpers.js'
import { PAYMENT_METHOD_LABELS } from './rules.js'
import { PRODUCT_IMAGES, PRODUCT_PHOTOS } from './productPhotos.js'

/** Bump this when the shape of the data changes: stored demo data with another version is replaced. */
export const DB_VERSION = 6

const STAFF = ['Aarav Mehta', 'Priya Nair', 'Rohan Kulkarni']
const CARRIERS = ['SwiftShip Express', 'Metro Courier', 'TransIndia Logistics', 'BlueLine Couriers']

/* ---------- Repeatable randomness ----------------------------------------- */

function createRandom(seed) {
  // mulberry32: tiny, fast and good enough for demo data.
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min, max) => min + Math.floor(next() * (max - min + 1))
  const pick = (list) => list[Math.floor(next() * list.length)]
  const chance = (probability) => next() < probability
  const weighted = (list, weightOf) => {
    const total = list.reduce((sum, item) => sum + weightOf(item), 0)
    let roll = next() * total
    for (const item of list) {
      roll -= weightOf(item)
      if (roll <= 0) return item
    }
    return list[list.length - 1]
  }
  return { next, int, pick, chance, weighted }
}

/* ---------- Catalogue ------------------------------------------------------ */

// [name, price, unit]
const CATALOGUE = [
  {
    name: 'Electronics',
    code: 'ELE',
    color: 'indigo',
    popularity: 1.4,
    description: 'Computer accessories, audio and charging gear.',
    products: [
      ['Wireless Optical Mouse', 699, 'pcs'],
      ['Mechanical Keyboard TKL', 3499, 'pcs'],
      ['USB-C Charging Cable 1m', 299, 'pcs'],
      ['27-inch IPS Monitor', 14999, 'pcs'],
      ['Bluetooth Earbuds', 1999, 'pcs'],
      ['Power Bank 10,000 mAh', 1299, 'pcs'],
      ['Full HD Webcam', 2499, 'pcs'],
    ],
  },
  {
    name: 'Office Supplies',
    code: 'OFF',
    color: 'amber',
    popularity: 1.3,
    description: 'Paper, writing instruments and everyday desk essentials.',
    products: [
      ['A4 Copier Paper, 500 sheets', 349, 'pack'],
      ['Gel Pen Set of 10', 149, 'pack'],
      ['Spiral Notebook A5', 99, 'pcs'],
      ['Heavy-Duty Stapler', 399, 'pcs'],
      ['Desk Organiser Tray', 549, 'pcs'],
      ['Whiteboard Marker Set', 229, 'pack'],
      ['Sticky Notes Cube', 129, 'pcs'],
    ],
  },
  {
    name: 'Furniture',
    code: 'FUR',
    color: 'violet',
    popularity: 0.7,
    description: 'Chairs, desks and storage for offices and homes.',
    products: [
      ['Ergonomic Mesh Chair', 8999, 'pcs'],
      ['Height-Adjustable Desk', 24999, 'pcs'],
      ['Three-Drawer Pedestal', 6499, 'pcs'],
      ['Five-Tier Bookshelf', 4999, 'pcs'],
      ['Cushioned Visitor Chair', 2999, 'pcs'],
      ['Wooden Monitor Riser', 1299, 'pcs'],
      ['Adjustable Footrest', 999, 'pcs'],
    ],
  },
  {
    name: 'Kitchen & Dining',
    code: 'KIT',
    color: 'rose',
    popularity: 1.1,
    description: 'Bottles, cookware and storage for pantries and cafeterias.',
    products: [
      ['Steel Water Bottle 1L', 499, 'pcs'],
      ['Ceramic Mug Set of 4', 799, 'set'],
      ['Electric Kettle 1.5L', 1499, 'pcs'],
      ['Glass Food Containers, 3 pc', 899, 'set'],
      ['Insulated Lunch Box', 699, 'pcs'],
      ['Bamboo Cutting Board', 449, 'pcs'],
      ['Three-Tier Steel Tiffin', 599, 'pcs'],
    ],
  },
  {
    name: 'Personal Care',
    code: 'PER',
    color: 'pink',
    popularity: 0.9,
    description: 'Hygiene and grooming products.',
    products: [
      ['Hand Sanitiser 500ml', 199, 'pcs'],
      ['Bamboo Toothbrush, 4 pack', 249, 'pack'],
      ['Herbal Face Wash', 299, 'pcs'],
      ['Aloe Vera Moisturiser', 349, 'pcs'],
      ['Cotton Hand Towel', 249, 'pcs'],
      ['Cordless Beard Trimmer', 1899, 'pcs'],
      ['Compact Hair Dryer', 1599, 'pcs'],
    ],
  },
  {
    name: 'Tools & Hardware',
    code: 'TOO',
    color: 'teal',
    popularity: 0.8,
    description: 'Hand tools, power tools and workshop gear.',
    products: [
      ['Cordless Drill 18V', 4999, 'pcs'],
      ['Screwdriver Set, 32 pc', 799, 'set'],
      ['Measuring Tape 5m', 249, 'pcs'],
      ['Rechargeable LED Work Light', 1099, 'pcs'],
      ['Nitrile Safety Gloves', 199, 'pack'],
      ['Adjustable Wrench 10-inch', 449, 'pcs'],
      ['Aluminium Spirit Level 60cm', 599, 'pcs'],
    ],
  },
  {
    name: 'Packaging',
    code: 'PAC',
    color: 'sky',
    popularity: 1.0,
    description: 'Boxes, tapes and protective materials for shipping.',
    products: [
      ['Corrugated Box Medium, 25 pc', 899, 'pack'],
      ['Bubble Wrap Roll 50m', 1199, 'pcs'],
      ['Packing Tape, 6 rolls', 349, 'pack'],
      ['Kraft Mailer Envelopes, 50 pc', 699, 'pack'],
      ['Stretch Film 500mm', 999, 'pcs'],
      ['Thermal Labels 4x6, 500 pc', 799, 'pack'],
      ['Void Fill Paper Roll', 649, 'pcs'],
    ],
  },
  {
    name: 'Sports & Fitness',
    code: 'SPO',
    color: 'emerald',
    popularity: 0.9,
    description: 'Training equipment and accessories.',
    products: [
      ['Yoga Mat 6mm', 899, 'pcs'],
      ['Resistance Band Set', 599, 'set'],
      ['Dumbbell Pair 5kg', 1799, 'set'],
      ['Speed Skipping Rope', 249, 'pcs'],
      ['Gym Duffel Bag', 1299, 'pcs'],
      ['High-Density Foam Roller', 699, 'pcs'],
      ['Protein Shaker Bottle', 349, 'pcs'],
    ],
  },
]

// [name, contact, city, country, leadTimeDays, paymentTerms, category codes]
const SUPPLIERS = [
  ['Apex Electronics Distributors', 'Vikram Rao', 'Bengaluru', 'India', 5, 'Net 30', ['ELE']],
  ['Brightline Components', 'Neha Joshi', 'Pune', 'India', 7, 'Net 45', ['ELE', 'TOO']],
  ['Paperleaf Stationers', 'Sanjay Gupta', 'Delhi', 'India', 3, 'Net 15', ['OFF']],
  ['Oakridge Furniture Works', 'Meera Pillai', 'Jodhpur', 'India', 14, 'Net 30', ['FUR']],
  ['Hearth & Home Kitchenware', 'Farhan Sheikh', 'Moradabad', 'India', 6, 'Net 30', ['KIT']],
  ['PureGlow Care Products', 'Anjali Desai', 'Ahmedabad', 'India', 4, 'Net 15', ['PER']],
  ['ToolCraft Industrial', 'Harpreet Singh', 'Ludhiana', 'India', 8, 'Net 45', ['TOO']],
  ['BoxRight Packaging', 'Kiran Shetty', 'Mumbai', 'India', 3, 'Due on receipt', ['PAC']],
  ['FitNation Sports Supply', 'Arjun Menon', 'Jalandhar', 'India', 9, 'Net 30', ['SPO']],
  ['Global Source Trading', 'Lina Fernandes', 'Singapore', 'Singapore', 21, 'Advance', ['ELE', 'KIT', 'PER']],
]

// [name, type, company, city, state, postalCode]
const CUSTOMERS = [
  ['Ananya Sharma', 'individual', '', 'Mumbai', 'Maharashtra', '400050'],
  ['Rahul Verma', 'business', 'Verma Tech Solutions', 'Pune', 'Maharashtra', '411001'],
  ['Kavya Iyer', 'individual', '', 'Chennai', 'Tamil Nadu', '600028'],
  ['Siddharth Rao', 'business', 'Rao Logistics', 'Hyderabad', 'Telangana', '500081'],
  ['Ishita Banerjee', 'individual', '', 'Kolkata', 'West Bengal', '700019'],
  ['Aditya Kapoor', 'business', 'Kapoor & Sons Retail', 'Delhi', 'Delhi', '110017'],
  ['Meghna Reddy', 'individual', '', 'Bengaluru', 'Karnataka', '560034'],
  ['Nikhil Patil', 'business', 'Patil Constructions', 'Nashik', 'Maharashtra', '422005'],
  ['Pooja Agarwal', 'individual', '', 'Jaipur', 'Rajasthan', '302017'],
  ['Varun Malhotra', 'business', 'Malhotra Co-Working Spaces', 'Gurugram', 'Haryana', '122002'],
  ['Sneha Kulkarni', 'individual', '', 'Pune', 'Maharashtra', '411038'],
  ['Arjun Nambiar', 'individual', '', 'Kochi', 'Kerala', '682020'],
  ['Divya Choudhary', 'business', 'Bloom Cafe Group', 'Indore', 'Madhya Pradesh', '452010'],
  ['Karan Mehra', 'individual', '', 'Chandigarh', 'Chandigarh', '160017'],
  ['Riya Sen', 'individual', '', 'Kolkata', 'West Bengal', '700091'],
  ['Manish Tiwari', 'business', 'Tiwari Fitness Studio', 'Lucknow', 'Uttar Pradesh', '226010'],
  ['Tanvi Shah', 'individual', '', 'Ahmedabad', 'Gujarat', '380015'],
  ['Abhishek Jain', 'business', 'Jain Office Mart', 'Surat', 'Gujarat', '395007'],
  ['Neha Saxena', 'individual', '', 'Bhopal', 'Madhya Pradesh', '462016'],
  ['Rohit Bhatia', 'individual', '', 'Noida', 'Uttar Pradesh', '201301'],
  ['Shreya Ghosh', 'business', 'Ghosh Design Studio', 'Kolkata', 'West Bengal', '700029'],
  ['Vivek Pandey', 'individual', '', 'Varanasi', 'Uttar Pradesh', '221005'],
  ['Aisha Khan', 'business', 'Crescent Hospitality', 'Hyderabad', 'Telangana', '500034'],
  ['Gaurav Sinha', 'individual', '', 'Patna', 'Bihar', '800001'],
  ['Lakshmi Narayan', 'business', 'Narayan Medical Supplies', 'Coimbatore', 'Tamil Nadu', '641018'],
  ['Pranav Deshmukh', 'individual', '', 'Nagpur', 'Maharashtra', '440010'],
  ['Simran Kaur', 'individual', '', 'Amritsar', 'Punjab', '143001'],
  ['Omkar Bhosale', 'business', 'Bhosale Packaging Hub', 'Kolhapur', 'Maharashtra', '416003'],
]

const STREETS = [
  'MG Road', 'Linking Road', 'Park Street', 'Anna Salai', 'Church Street', 'FC Road', 'Banjara Hills Road 12',
  'Sector 18 Market', 'Residency Road', 'Ashram Road', 'Civil Lines', 'Mall Road', 'Station Road',
]
const ORDER_NOTES = ['Please call before delivery.', 'Deliver after 5 PM.', 'Gift wrap, please.', 'Leave with the security desk.']
const DAMAGE_NOTES = ['Broken in transit', 'Water damage in storage', 'Packaging torn, unsellable', 'Expired stock removed']

// Weekday rhythm of orders: Sunday quiet, Friday busiest.
const WEEKDAY_WEIGHT = [0.6, 1, 1.05, 1.1, 1.05, 1.15, 0.85]
const PAYMENT_WEIGHT = { upi: 40, card: 25, bank_transfer: 12, cod: 18, cash: 5 }

const iso = (date) => date.toISOString()
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')

/* ---------- Seed ----------------------------------------------------------- */

export function buildSeed(now = new Date()) {
  const rnd = createRandom(20261114)
  const id = (prefix) => newId(prefix, rnd.next)
  const start = startOfDay(subDays(now, 364))
  const openingAt = subDays(start, 1)
  const todayStart = startOfDay(now)

  /* Categories */
  const categories = CATALOGUE.map((entry, index) => ({
    id: id('cat'),
    name: entry.name,
    description: entry.description,
    color: entry.color,
    createdAt: iso(addHours(openingAt, -24 * (40 - index))),
    updatedAt: iso(addHours(openingAt, -24 * (40 - index))),
  }))

  /* Suppliers */
  const suppliers = SUPPLIERS.map(([name, contactName, city, country, leadTimeDays, paymentTerms], index) => {
    const created = iso(addHours(openingAt, -24 * (60 - index * 3)))
    return {
      id: id('sup'),
      name,
      contactName,
      email: `${slug(contactName)}@example.com`,
      phone: country === 'India' ? `+91 55502 ${String(10000 + index * 731).slice(-5)}` : `+65 5550 ${String(1000 + index * 17)}`,
      address: `${rnd.int(2, 220)}, ${rnd.pick(['Industrial Estate', 'Trade Centre', 'Business Park', 'Market Yard'])}`,
      city,
      country,
      leadTimeDays,
      paymentTerms,
      status: index === 9 ? 'inactive' : 'active',
      notes: index === 9 ? 'Paused while we review import duties.' : '',
      createdAt: created,
      updatedAt: created,
    }
  })
  const suppliersFor = (code) =>
    SUPPLIERS.map((entry, index) => (entry[6].includes(code) ? suppliers[index] : null)).filter(
      (supplier) => supplier && supplier.status === 'active',
    )

  /* Products */
  const products = []
  CATALOGUE.forEach((entry, categoryIndex) => {
    const options = suppliersFor(entry.code)
    entry.products.forEach(([name, price, unit], productIndex) => {
      const cheap = price < 500
      const pricey = price >= 5000
      const reorderLevel = cheap ? rnd.int(15, 25) : pricey ? rnd.int(3, 6) : rnd.int(8, 14)
      const costPrice = Math.round(price * (0.55 + rnd.next() * 0.2))
      products.push({
        id: id('prd'),
        sku: `${entry.code}-${String(categoryIndex * 10 + productIndex + 1).padStart(4, '0')}`,
        name,
        description: `${name} from our ${entry.name.toLowerCase()} range.`,
        categoryId: categories[categoryIndex].id,
        supplierId: options[productIndex % options.length].id,
        unit,
        costPrice,
        price,
        stock: 0,
        reorderLevel,
        reorderQty: Math.max(5, Math.round((reorderLevel * 3) / 5) * 5),
        location: `${'ABCDEFGH'[categoryIndex]}-${String(rnd.int(1, 24)).padStart(2, '0')}`,
        barcode: `890${String(1000000000 + categoryIndex * 1234567 + productIndex * 98765).slice(0, 10)}`,
        status: 'active',
        // Illustrations generated by scripts/generate-product-images.mjs (served from public/products).
        imageUrl: PRODUCT_PHOTOS[`${entry.code}-${String(categoryIndex * 10 + productIndex + 1).padStart(4, '0')}`] ?? PRODUCT_IMAGES[(categoryIndex * 7 + productIndex) % PRODUCT_IMAGES.length] ?? `/products/${entry.code}-${String(categoryIndex * 10 + productIndex + 1).padStart(4, '0')}.svg`,
        createdAt: iso(openingAt),
        updatedAt: iso(openingAt),
        popularity: entry.popularity * (price < 1000 ? 3 : price < 5000 ? 1.6 : 0.6),
      })
    })
  })

  // Two products still being set up, one retired product.
  const drafts = [products[13], products[34]]
  drafts.forEach((product, index) => {
    product.status = 'draft'
    const created = iso(subDays(now, 6 + index * 5))
    product.createdAt = created
    product.updatedAt = created
  })
  const archived = products[27]
  archived.status = 'archived'
  const archivedAfter = subDays(now, 120)

  // Final stock levels we aim for: a healthy majority, some low, some out.
  const sellable = products.filter((product) => product.status === 'active')
  const outTargets = new Set([sellable[3], sellable[18], sellable[33], sellable[44]].map((product) => product.id))
  const lowTargets = new Set(
    [sellable[1], sellable[7], sellable[11], sellable[15], sellable[22], sellable[26], sellable[30], sellable[38], sellable[47]].map(
      (product) => product.id,
    ),
  )
  const targetOf = new Map()
  for (const product of products) {
    let target
    if (product.status === 'draft') target = rnd.int(10, 24)
    else if (product === archived || outTargets.has(product.id)) target = 0
    else if (lowTargets.has(product.id)) target = rnd.int(1, product.reorderLevel)
    else target = rnd.int(product.reorderLevel + 4, product.reorderLevel * 5 + 6)
    targetOf.set(product.id, target)
  }

  /* Customers */
  const customers = CUSTOMERS.map(([name, type, company, city, state, postalCode], index) => {
    // Customers joined over the year; three of them this month.
    const joinedDaysAgo = index < 25 ? Math.round(360 - index * 13.5) : rnd.int(2, 12)
    const created = iso(addHours(startOfDay(subDays(now, joinedDaysAgo)), rnd.int(9, 18)))
    const [first, ...rest] = name.split(' ')
    return {
      id: id('cus'),
      name,
      email: `${slug(first)}.${slug(rest.join(' '))}@example.com`,
      phone: `+91 55501 0${String(1000 + index * 37).slice(-4)}`,
      company,
      type,
      address: {
        line1: `${rnd.int(3, 180)}, ${rnd.pick(STREETS)}`,
        line2: type === 'business' ? `Unit ${rnd.int(101, 905)}` : '',
        city,
        state,
        postalCode,
        country: 'India',
      },
      notes: type === 'business' && index % 3 === 0 ? 'Prefers consolidated monthly invoices.' : '',
      createdAt: created,
      updatedAt: created,
    }
  })
  // Loyal customers order far more often than occasional ones.
  const loyalty = new Map(customers.map((customer, index) => [customer.id, 1 / Math.pow(((index * 11) % 28) + 1, 0.75)]))

  /* Sales orders: how many per day (rising trend + weekday rhythm) */
  const dayCounts = new Array(365).fill(0)
  const allocate = (fromDay, toDay, total) => {
    const weights = []
    for (let day = fromDay; day <= toDay; day += 1) {
      const date = addDays(start, day)
      weights.push((0.5 + day / 364) * WEEKDAY_WEIGHT[date.getDay()])
    }
    const sum = weights.reduce((a, b) => a + b, 0)
    let carry = 0
    weights.forEach((weight, offset) => {
      const exact = (weight / sum) * total + carry
      const count = Math.floor(exact + 0.5)
      carry = exact - count
      dayCounts[fromDay + offset] = count
    })
  }
  allocate(0, 334, 286)
  allocate(335, 363, 49)
  dayCounts[364] = 3

  const movements = []
  const addMovement = (product, fields) => {
    movements.push({ id: id('mov'), productId: product.id, note: '', reference: null, createdBy: 'System', ...fields })
  }

  const orderDrafts = []
  for (let day = 0; day < 365; day += 1) {
    for (let n = 0; n < dayCounts[day]; n += 1) {
      let createdAt
      if (day === 364) {
        // Today's orders happened between midnight and now.
        const minutesSoFar = Math.max(1, Math.floor((now - todayStart) / 60000))
        createdAt = addMinutes(todayStart, Math.floor(((n + 0.5) / dayCounts[day]) * minutesSoFar))
      } else {
        createdAt = addMinutes(addHours(addDays(start, day), rnd.int(9, 20)), rnd.int(0, 59))
      }
      orderDrafts.push(createdAt)
    }
  }
  orderDrafts.sort((a, b) => a - b)

  const orders = []
  orderDrafts.forEach((createdAt, index) => {
    const eligible = customers.filter((customer) => new Date(customer.createdAt) <= createdAt)
    const customer = rnd.weighted(eligible.length ? eligible : customers, (item) => loyalty.get(item.id))

    const available = products.filter(
      (product) => product.status === 'active' || (product === archived && createdAt < archivedAfter),
    )
    const lineCount = rnd.weighted([1, 2, 3, 4], (count) => [45, 30, 17, 8][count - 1])
    const chosen = []
    while (chosen.length < lineCount) {
      const product = rnd.weighted(available, (item) => item.popularity)
      if (!chosen.includes(product)) chosen.push(product)
    }
    const items = chosen.map((product) => {
      const quantity = product.price < 500 ? rnd.int(1, 5) : product.price < 2000 ? rnd.int(1, 3) : rnd.chance(0.8) ? 1 : 2
      return {
        id: id('itm'),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity,
        lineTotal: roundMoney(product.price * quantity),
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    let discountType = 'amount'
    let discountValue = 0
    if (rnd.chance(0.18)) {
      if (subtotal >= 3000) {
        discountType = 'percent'
        discountValue = rnd.pick([5, 10])
      } else {
        discountValue = Math.min(rnd.pick([50, 100]), Math.floor(subtotal / 4))
      }
    }
    const shippingFee = subtotal >= 1999 ? 0 : 99
    const totals = calculateOrderTotals({ items, discountType, discountValue, taxRate: 18, shippingFee })

    // Lifecycle: each step happens some hours after the previous one; the status is the last step reached by now.
    const processingAt = addMinutes(createdAt, rnd.int(60, 360))
    const shippedAt = addMinutes(processingAt, rnd.int(600, 1800))
    const deliveredAt = addMinutes(shippedAt, rnd.int(1800, 5400))
    const cancelAt = rnd.chance(0.06) ? addMinutes(createdAt, rnd.int(60, 1200)) : null
    const cancelled = cancelAt && cancelAt <= now

    const paymentMethod = rnd.weighted(Object.keys(PAYMENT_WEIGHT), (method) => PAYMENT_WEIGHT[method])
    let paidAt
    if (paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'cash') paidAt = addMinutes(createdAt, rnd.int(1, 8))
    else if (paymentMethod === 'bank_transfer') paidAt = addMinutes(createdAt, rnd.int(120, 1800))
    else paidAt = deliveredAt
    if (paidAt > now || (cancelled && paidAt > cancelAt)) paidAt = null

    const by = rnd.pick(STAFF)
    const timeline = [{ id: id('evt'), type: 'created', status: 'pending', title: 'Order placed', note: '', at: iso(createdAt), by }]
    let status = 'pending'
    let carrier = ''
    let trackingNumber = ''

    if (cancelled) {
      if (processingAt < cancelAt) {
        timeline.push({ id: id('evt'), type: 'status', status: 'processing', title: 'Marked as processing', note: '', at: iso(processingAt), by })
      }
      timeline.push({
        id: id('evt'),
        type: 'status',
        status: 'cancelled',
        title: 'Order cancelled',
        note: rnd.pick(['Customer changed their mind.', 'Duplicate order.', 'Delivery address not serviceable.']),
        at: iso(cancelAt),
        by,
      })
      status = 'cancelled'
    } else {
      if (processingAt <= now) {
        status = 'processing'
        timeline.push({ id: id('evt'), type: 'status', status: 'processing', title: 'Marked as processing', note: '', at: iso(processingAt), by })
      }
      if (shippedAt <= now) {
        status = 'shipped'
        carrier = rnd.pick(CARRIERS)
        trackingNumber = `${carrier.slice(0, 2).toUpperCase()}${rnd.int(100000000, 999999999)}`
        timeline.push({
          id: id('evt'),
          type: 'status',
          status: 'shipped',
          title: `Shipped with ${carrier}`,
          note: `Tracking number ${trackingNumber}`,
          at: iso(shippedAt),
          by,
        })
      }
      if (deliveredAt <= now) {
        status = 'delivered'
        timeline.push({ id: id('evt'), type: 'status', status: 'delivered', title: 'Delivered', note: '', at: iso(deliveredAt), by })
      }
    }

    let paymentStatus = 'unpaid'
    if (paidAt) {
      paymentStatus = 'paid'
      timeline.push({
        id: id('evt'),
        type: 'payment',
        title: 'Payment received',
        note: `${PAYMENT_METHOD_LABELS[paymentMethod]} · ${totals.total.toFixed(2)}`,
        at: iso(paidAt),
        by,
      })
      if (cancelled) {
        paymentStatus = 'refunded'
        timeline.push({ id: id('evt'), type: 'payment', title: 'Payment refunded', note: '', at: iso(addMinutes(cancelAt, 5)), by })
      }
    }
    timeline.sort((a, b) => a.at.localeCompare(b.at))

    const orderNumber = `SO-${10001 + index}`
    items.forEach((item) => {
      const product = products.find((entry) => entry.id === item.productId)
      addMovement(product, { type: 'out', quantity: item.quantity, delta: -item.quantity, reason: 'sale', reference: orderNumber, createdAt: iso(createdAt) })
      if (cancelled) {
        addMovement(product, {
          type: 'in',
          quantity: item.quantity,
          delta: item.quantity,
          reason: 'cancellation',
          reference: orderNumber,
          createdAt: iso(cancelAt),
        })
      }
    })

    const lastChange = timeline[timeline.length - 1].at
    orders.push({
      id: id('ord'),
      orderNumber,
      customerId: customer.id,
      items,
      itemsCount: totals.itemsCount,
      subtotal: totals.subtotal,
      discountType,
      discountValue,
      discountAmount: totals.discountAmount,
      taxRate: 18,
      taxAmount: totals.taxAmount,
      shippingFee: totals.shippingFee,
      total: totals.total,
      status,
      paymentStatus,
      paymentMethod,
      shippingAddress: { name: customer.name, phone: customer.phone, ...customer.address },
      carrier,
      trackingNumber,
      notes: rnd.chance(0.12) ? rnd.pick(ORDER_NOTES) : '',
      timeline,
      createdAt: iso(createdAt),
      updatedAt: lastChange,
    })
  })

  /* Purchase orders */
  const urgent = products.filter((product) => outTargets.has(product.id) || lowTargets.has(product.id))
  const urgentSuppliers = [...new Set(urgent.map((product) => product.supplierId))]
  const productsOf = (supplierId) => products.filter((product) => product.supplierId === supplierId && product.status === 'active')

  const poPlans = [
    { status: 'received', daysAgo: 300 },
    { status: 'received', daysAgo: 240 },
    { status: 'received', daysAgo: 180 },
    { status: 'received', daysAgo: 121 },
    { status: 'cancelled', daysAgo: 75 },
    { status: 'received', daysAgo: 60 },
    { status: 'received', daysAgo: 26 },
    { status: 'partial', daysAgo: 18 },
    { status: 'partial', daysAgo: 12 },
    { status: 'ordered', daysAgo: 16, overdue: true },
    { status: 'ordered', daysAgo: 4 },
    { status: 'ordered', daysAgo: 1 },
    { status: 'draft', daysAgo: 1 },
    { status: 'draft', daysAgo: 0 },
  ]
  let openIndex = 0
  const purchaseOrders = poPlans.map((plan, index) => {
    const open = ['partial', 'ordered', 'draft'].includes(plan.status)
    let supplier = suppliers[index % 9]
    if (open) {
      const supplierId = urgentSuppliers[openIndex % urgentSuppliers.length]
      openIndex += 1
      supplier = suppliers.find((entry) => entry.id === supplierId)
    }
    const pool = productsOf(supplier.id)
    const preferred = open ? pool.filter((product) => outTargets.has(product.id) || lowTargets.has(product.id)) : []
    const others = pool.filter((product) => !preferred.includes(product))
    // Open orders restock the products that are running low, plus one regular line.
    const lineProducts = open ? [...preferred.slice(0, 3), ...others.slice(0, 1)] : others.slice(0, rnd.int(2, 4))

    const createdAt =
      plan.daysAgo === 0 ? new Date(Math.max(todayStart.getTime(), now.getTime() - 40 * 60000)) : addHours(startOfDay(subDays(now, plan.daysAgo)), rnd.int(10, 16))
    const lead = plan.overdue ? 12 : supplier.leadTimeDays
    const expected = addDays(createdAt, lead)
    const by = rnd.pick(STAFF)

    const items = lineProducts.map((product) => ({
      id: id('itm'),
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      unitCost: product.costPrice,
      quantity: product.reorderQty,
      receivedQty: 0,
      lineTotal: roundMoney(product.costPrice * product.reorderQty),
    }))
    const shippingFee = rnd.pick([0, 250, 500])
    const totals = calculatePurchaseTotals({ items, taxRate: 18, shippingFee })
    const poNumber = `PO-${2001 + index}`

    const timeline = [
      {
        id: id('evt'),
        type: 'created',
        title: plan.status === 'draft' ? 'Draft created' : 'Purchase order created',
        note: '',
        at: iso(createdAt),
        by,
      },
    ]
    let receivedAt = null

    if (plan.status !== 'draft') {
      const sentAt = addMinutes(createdAt, rnd.int(10, 90))
      timeline.push({ id: id('evt'), type: 'status', title: `Sent to ${supplier.name}`, note: '', at: iso(sentAt), by })
      if (plan.status === 'cancelled') {
        timeline.push({ id: id('evt'), type: 'status', title: 'Purchase order cancelled', note: 'Supplier could not meet the delivery date.', at: iso(addDays(sentAt, 2)), by })
      }
      if (plan.status === 'received' || plan.status === 'partial') {
        const arrival = addHours(startOfDay(addDays(createdAt, plan.status === 'partial' ? Math.min(lead, plan.daysAgo - 2) : lead)), 11)
        const receivedLines = []
        items.forEach((item, lineIndex) => {
          let quantity = item.quantity
          if (plan.status === 'partial') {
            // Partly received: the regular line got half of its delivery, the restock lines are still on the way.
            const isRestock = preferred.some((product) => product.id === item.productId)
            const fallbackFirst = lineIndex === 0 && items.every((line) => preferred.some((product) => product.id === line.productId))
            quantity = isRestock && !fallbackFirst ? 0 : Math.max(1, Math.min(Math.ceil(item.quantity / 2), targetOf.get(item.productId)))
          }
          if (quantity > 0) {
            item.receivedQty = quantity
            receivedLines.push(`${quantity} × ${item.sku}`)
            const product = products.find((entry) => entry.id === item.productId)
            addMovement(product, {
              type: 'in',
              quantity,
              delta: quantity,
              reason: 'purchase',
              reference: poNumber,
              createdAt: iso(arrival),
              createdBy: by,
            })
          }
        })
        timeline.push({
          id: id('evt'),
          type: 'received',
          title: plan.status === 'received' ? 'All items received' : 'Items partly received',
          note: receivedLines.join(', '),
          at: iso(arrival),
          by,
        })
        if (plan.status === 'received') receivedAt = iso(arrival)
      }
    }

    const receivedCount = items.reduce((sum, item) => sum + item.receivedQty, 0)
    return {
      id: id('po'),
      poNumber,
      supplierId: supplier.id,
      items,
      itemsCount: totals.itemsCount,
      receivedCount,
      subtotal: totals.subtotal,
      taxRate: 18,
      taxAmount: totals.taxAmount,
      shippingFee: totals.shippingFee,
      total: totals.total,
      status: plan.status,
      expectedDate: format(expected, 'yyyy-MM-dd'),
      receivedAt,
      notes: plan.overdue ? 'Supplier confirmed dispatch; chase if not delivered this week.' : '',
      timeline,
      createdAt: iso(createdAt),
      updatedAt: timeline[timeline.length - 1].at,
    }
  })

  /* A few everyday stock events: damages and customer returns */
  const steady = products.filter((product) => product.status === 'active' && !outTargets.has(product.id) && !lowTargets.has(product.id))
  for (let n = 0; n < 6; n += 1) {
    const product = rnd.pick(steady)
    const quantity = rnd.int(1, 2)
    addMovement(product, {
      type: 'out',
      quantity,
      delta: -quantity,
      reason: 'damage',
      note: rnd.pick(DAMAGE_NOTES),
      createdAt: iso(addHours(addDays(start, rnd.int(20, 350)), rnd.int(9, 18))),
      createdBy: rnd.pick(STAFF),
    })
  }
  for (let n = 0; n < 3; n += 1) {
    const order = orders[rnd.int(40, orders.length - 60)]
    if (order.status !== 'delivered') continue
    const item = order.items[0]
    const product = products.find((entry) => entry.id === item.productId)
    addMovement(product, {
      type: 'in',
      quantity: 1,
      delta: 1,
      reason: 'return',
      reference: order.orderNumber,
      note: 'Returned unopened within 7 days.',
      createdAt: iso(addDays(new Date(order.createdAt), 6)),
      createdBy: rnd.pick(STAFF),
    })
  }

  /* Opening stock: chosen so each product ends exactly on its target without ever dipping below zero */
  for (const product of products) {
    const own = movements
      .filter((movement) => movement.productId === product.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const target = targetOf.get(product.id)
    const totalDelta = own.reduce((sum, movement) => sum + movement.delta, 0)
    let opening = target - totalDelta

    // Find the lowest point of the running balance and the last time it was negative.
    let balance = opening
    let lowest = Math.min(0, opening)
    let lastNegative = opening < 0 ? -1 : null
    own.forEach((movement, index) => {
      balance += movement.delta
      if (balance < 0) lastNegative = index
      lowest = Math.min(lowest, balance)
    })
    if (lowest < 0) {
      // Start higher, then a stock count after the dip brings the count back in line.
      const extra = -lowest
      opening += extra
      const after = own[lastNegative + 1]
      addMovement(product, {
        type: 'out',
        quantity: extra,
        delta: -extra,
        reason: 'correction',
        note: 'Stock count correction after audit',
        createdAt: iso(new Date(Math.min(addMinutes(new Date(after.createdAt), 1).getTime(), now.getTime()))),
        createdBy: 'Priya Nair',
      })
    }

    const openingAtProduct = product.status === 'draft' ? addMinutes(new Date(product.createdAt), 30) : openingAt
    if (opening > 0) {
      addMovement(product, {
        type: 'in',
        quantity: opening,
        delta: opening,
        reason: 'initial',
        reference: 'Opening balance',
        createdAt: iso(openingAtProduct),
        createdBy: 'Aarav Mehta',
      })
    }
  }

  // Running balances, in time order, per product.
  movements.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || (b.delta > 0) - (a.delta > 0))
  const balances = new Map()
  for (const movement of movements) {
    const next = (balances.get(movement.productId) ?? 0) + movement.delta
    balances.set(movement.productId, next)
    movement.balanceAfter = next
  }
  for (const product of products) {
    product.stock = balances.get(product.id) ?? 0
    const last = movements.filter((movement) => movement.productId === product.id).at(-1)
    if (last && last.createdAt > product.updatedAt) product.updatedAt = last.createdAt
    if (product === archived) product.updatedAt = iso(archivedAfter)
    delete product.popularity
  }
  movements.reverse() // newest first, the order the app shows them in

  /* Notifications */
  const recentOrders = orders.slice(-4).reverse()
  const lowProducts = products.filter((product) => lowTargets.has(product.id)).slice(0, 3)
  const outProducts = products.filter((product) => outTargets.has(product.id)).slice(0, 2)
  const lastReceived = purchaseOrders.filter((po) => po.status === 'received').at(-1)
  const notifications = [
    ...recentOrders.slice(0, 3).map((order, index) => ({
      type: 'new_order',
      title: `New order ${order.orderNumber}`,
      message: `${customers.find((customer) => customer.id === order.customerId).name} placed an order of ${order.itemsCount} items.`,
      link: `/orders/${order.id}`,
      read: index > 1,
      createdAt: order.createdAt,
    })),
    ...outProducts.map((product, index) => ({
      type: 'out_of_stock',
      title: `${product.name} is out of stock`,
      message: `${product.sku} has no units left. Reorder to keep selling.`,
      link: `/products/${product.id}`,
      read: false,
      createdAt: iso(subDays(now, 1 + index)),
    })),
    ...lowProducts.map((product, index) => ({
      type: 'low_stock',
      title: `Low stock: ${product.name}`,
      message: `Only ${product.stock} ${product.unit} left (reorder level ${product.reorderLevel}).`,
      link: `/products/${product.id}`,
      read: index > 0,
      createdAt: iso(subDays(now, 2 + index)),
    })),
    {
      type: 'purchase_order',
      title: `${lastReceived.poNumber} received`,
      message: `${lastReceived.receivedCount} units added to stock.`,
      link: `/purchase-orders/${lastReceived.id}`,
      read: true,
      createdAt: lastReceived.receivedAt,
    },
    {
      type: 'system',
      title: 'Welcome to Inventra',
      message: 'This workspace runs on demo data. Connect your backend from Settings → Data & API.',
      link: '/settings?tab=data',
      read: true,
      createdAt: iso(subDays(now, 30)),
    },
  ]
    .map((notification) => ({ id: id('ntf'), ...notification }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const seededAt = iso(now)
  return {
    version: DB_VERSION,
    seededAt,
    pristine: true,
    users: [
      {
        id: id('usr'),
        name: 'Aarav Mehta',
        email: DEMO_CREDENTIALS.email,
        role: 'admin',
        phone: '+91 55500 01234',
        jobTitle: 'Operations Manager',
        createdAt: iso(subDays(openingAt, 60)),
      },
    ],
    settings: {
      companyName: 'Sahyadri Supply Co.',
      companyEmail: 'hello@sahyadri-supply.example.com',
      companyPhone: '+91 55500 04321',
      companyAddress: '14, Riverside Business Park, Baner, Pune, Maharashtra 411045, India',
      taxId: '27AAAAA0000A1Z5',
      currency: 'INR',
      taxRate: 18,
      defaultReorderLevel: 10,
      orderPrefix: 'SO-',
      purchaseOrderPrefix: 'PO-',
      invoiceNotes: 'Thank you for your business! Goods once sold can be returned within 7 days in original packaging.',
      notifications: { lowStock: true, newOrder: true, orderStatus: true, purchaseOrder: true, weeklySummary: false },
      updatedAt: iso(openingAt),
    },
    categories,
    suppliers,
    products,
    customers,
    orders,
    purchaseOrders,
    stockMovements: movements,
    notifications,
    counters: { order: 10001 + orders.length, purchaseOrder: 2001 + purchaseOrders.length },
  }
}
