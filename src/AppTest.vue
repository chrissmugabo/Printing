<script setup lang="ts"></script>
<template>
  <div class="invoice-header">
    <div class="invoice-details">
      <h2>Restaurant Name</h2>
      <p>123 Main Street, Anytown, CA 12345</p>
      <p>(555) 555-5555</p>
    </div>
  </div>
  <div>
    <h3>Invoice # 2024-07-09-001</h3>
    <p>Date: 2024-07-09</p>
    <p>Table: 3</p>
    <p>Server: John Doe</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Margherita Pizza (Large)</td>
        <td>1</td>
        <td>$15.00</td>
        <td>$15.00</td>
      </tr>
      <tr>
        <td>Chicken Alfredo</td>
        <td>1</td>
        <td>$18.00</td>
        <td>$18.00</td>
      </tr>
      <tr>
        <td>Drinks (2)</td>
        <td>2</td>
        <td>$2.50</td>
        <td>$5.00</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th colspan="3" class="invoice-total">Subtotal</th>
        <td class="invoice-total">$38.00</td>
      </tr>
      <tr>
        <th colspan="3" class="invoice-total">Tax (8%)</th>
        <td class="invoice-total">$3.04</td>
      </tr>
      <tr>
        <th colspan="3" class="invoice-total">Total</th>
        <td class="invoice-total">$41.04</td>
      </tr>
    </tfoot>
  </table>
  <p>Thank you for your visit!</p>
</template>
<style>
body {
  font-family: sans-serif;
  margin: 0;
  padding: 0px;
}
.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  width: 100%;
}
.invoice-header img {
  width: 100px;
}
.invoice-details {
  text-align: right;
}
table {
  width: 100%;
  border-collapse: collapse;
}
table,
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  text-align: left;
}
.invoice-total {
  font-weight: bold;
}
</style>
