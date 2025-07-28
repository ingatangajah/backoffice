const express = require('express');
const router = express.Router();
const pool = require('../db');
const { generateInvoiceNumber } = require('../utils/helper');

router.post('/', async (req, res) => {
    const {
      student_id,
      package_id,
      class_id,
      discount_type,    // 'percent' or 'nominal', optional
      discount_value,    // numeric, optional
      document_link,
      payment_type
    } = req.body;
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      // 1. Create enrollment
      const enrollRes = await client.query(
        `INSERT INTO student_enrollments (student_id, package_id, class_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [student_id, package_id, class_id]
      );
      const enrollment_id = enrollRes.rows[0].id;
  
      // 2. Fetch base amount from package
      const pkgRes = await client.query(
        'SELECT base_price FROM packages WHERE id = $1',
        [package_id]
      );
      if (pkgRes.rows.length === 0) {
        throw new Error('Package not found');
      }
      const amount = parseFloat(pkgRes.rows[0].base_price);
  
      // 3. Calculate total_after_discount
      let total = amount;
      if (discount_type === 'percent') {
        total = amount * (100 - parseFloat(discount_value)) / 100;
      } else if (discount_type === 'nominal') {
        total = amount - parseFloat(discount_value);
      }
  
      // 4. Generate invoice number automatically
      const invoice_number = generateInvoiceNumber();
  
      // 5. Create invoice with status 'pending'
      const invRes = await client.query(
        `INSERT INTO invoices (
           student_enrollment_id,
           invoice_number,
           amount,
           discount_type,
           discount_value,
           total_after_discount,
           status,
           payment_document_link,
           payment_type
         ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8) RETURNING *`,
        [
          enrollment_id,
          invoice_number,
          amount,
          discount_type || null,
          discount_value || 0,
          total,
          document_link,
          payment_type
        ]
      );
  
      await client.query('COMMIT');
      res.status(201).json({
        enrollment: { id: enrollment_id, student_id, package_id, class_id },
        invoice: invRes.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating enrollment & invoice:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });
  

// PAY Invoice
router.post('/:id/pay', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE invoices SET status = 'paid', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error marking invoice as paid:', err);
    res.status(500).json({ error: err.message });
  }
});

// HISTORY: GET paginated list of invoice history
// GET /invoices/history?page=1&limit=20
router.get('/history', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const offset = limit ? (page - 1) * limit : null;

  try {
    // Total count
    const countRes = await pool.query('SELECT COUNT(*) FROM invoices');
    const totalCount = parseInt(countRes.rows[0].count, 10);
    const totalPages = limit ? Math.ceil(totalCount / limit) : 1;

    // Base SQL
    let q = `
      SELECT
        i.id,
        s.full_name AS student_name,
        p.name      AS package_name,
        i.invoice_number AS invoice_number,
        i.payment_type AS payment_type,
        i.payment_document_link AS payment_document_link,
        CASE
          WHEN i.discount_type = 'percent' THEN CONCAT(i.discount_value::text, '%')
          WHEN i.discount_type = 'nominal' THEN CONCAT('Rp. ', i.discount_value::text)
          ELSE '-' END AS discount,
        i.total_after_discount AS total_invoice,
        CASE WHEN i.status = 'paid' THEN 'Success' ELSE 'Pending' END AS payment_status
      FROM invoices i
      JOIN student_enrollments se ON se.id = i.student_enrollment_id
      JOIN students s ON se.student_id = s.id
      JOIN packages p ON se.package_id = p.id
      ORDER BY i.created_at DESC
    `;

    let values = [];

    if (limit !== null) {
      q += ` LIMIT $1 OFFSET $2`;
      values = [limit, offset];
    }

    const dataRes = await pool.query(q, values);

    res.status(200).json({
      page,
      limit,
      totalCount,
      totalPages,
      data: dataRes.rows,
    });
  } catch (err) {
    console.error('Error fetching invoice history:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
    try {
    const result = await pool.query(`SELECT
        i.id,
        s.full_name AS student_name,
        p.name      AS package_name,
        i.invoice_number AS invoice_number,
        i.payment_type AS payment_type,
        i.payment_document_link AS payment_document_link,
        CASE
          WHEN i.discount_type = 'percent' THEN CONCAT(i.discount_value::text, '%')
          WHEN i.discount_type = 'nominal' THEN CONCAT('Rp. ', i.discount_value::text)
          ELSE '-' END AS discount,
        i.total_after_discount AS total_invoice,
        CASE WHEN i.status = 'paid' THEN 'Success' ELSE 'Pending' END AS payment_status
      FROM invoices i
      JOIN student_enrollments se ON se.id = i.student_enrollment_id
      JOIN students s ON se.student_id = s.id
      JOIN packages p ON se.package_id = p.id
      WHERE i.id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
})

router.put('/:id', async (req, res) => {
  const { payment_status, document_link, payment_type } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE invoices
       SET payment_status = $1, payment_document_link = $2, payment_type = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [payment_status, document_link, payment_type, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// DELETE Invoice
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
