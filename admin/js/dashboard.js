// Admin dashboard — uses adminSupabase with no persistent session
import { adminSupabase, requireAuth, handleLogout } from './auth-guard.js';
import { getTodayCanada, formatTimeCanada, formatDateTimeCanada } from '../../js/canada-date.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication — redirects to login if no session
  await requireAuth();

  // Set user info in UI
  const {
    data: { session },
  } = await adminSupabase.auth.getSession();
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');
  if (userEmail) userEmail.textContent = session?.user?.email || '';
  if (userAvatar) {
    userAvatar.src =
      session?.user?.user_metadata?.avatar_url
        ? session.user.user_metadata.avatar_url
        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(session?.user?.email || 'Admin');
  }

  // Logout button
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }

  // Load today's orders (we'll filter by date, but for simplicity we'll get all pending/ready and sort by date)
  // Better: get orders from today only.
  const today = getTodayCanada(); // YYYY-MM-DD in Canada/Eastern

  // We'll load orders and feedback and set up realtime subscriptions

  // ===== Orders =====
  const ordersLoading = document.getElementById('ordersLoading');
  const ordersTableBody = document.getElementById('ordersTableBody');
  const ordersNoData = document.getElementById('ordersNoData');

  async function loadOrders() {
    if (ordersLoading) ordersLoading.style.display = 'block';
    if (ordersTableBody) ordersTableBody.innerHTML = '';
    if (ordersNoData) ordersNoData.style.display = 'none';

    const { data, error } = await adminSupabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
      // Optionally show error
      return;
    }

    if (ordersLoading) ordersLoading.style.display = 'none';

    if (!data || data.length === 0) {
      if (ordersNoData) ordersNoData.style.display = 'block';
      return;
    }

    // Render orders
    data.forEach((order) => {
      const tr = document.createElement('tr');

      // Booking ID
      const tdId = document.createElement('td');
      tdId.textContent = order.booking_id;
      tr.appendChild(tdId);

      // Customer name
      const tdName = document.createElement('td');
      tdName.textContent = order.name;
      tr.appendChild(tdName);

      // Phone
      const tdPhone = document.createElement('td');
      tdPhone.textContent = order.phone;
      tr.appendChild(tdPhone);

      // Items (JSONB)
      const tdItems = document.createElement('td');
      // Format items nicely
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const itemsList = items
          .map((item) => `${item.name} (×${item.quantity || 1})`)
          .join('<br>');
        tdItems.innerHTML = itemsList;
      } catch (e) {
        tdItems.textContent = 'Error parsing items';
      }
      tr.appendChild(tdItems);

      // Total
      const tdTotal = document.createElement('td');
      tdTotal.textContent = `$${order.total.toFixed(2)}`;
      tr.appendChild(tdTotal);

      // Status (with select dropdown)
      const tdStatus = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'status-select';
      select.value = order.status;
      ['pending', 'ready', 'collected'].forEach((status) => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent =
          status.charAt(0).toUpperCase() + status.slice(1);
        select.appendChild(option);
      });
      // Update status on change
      select.addEventListener('change', async () => {
        const newStatus = select.value;
        const { error } = await adminSupabase
          .from('orders')
          .update({ status: newStatus })
          .eq('booking_id', order.booking_id);
        if (error) {
          console.error('Error updating order status:', error);
          // Revert select value on error?
          select.value = order.status;
        } else {
          // Update locally for UI consistency
          order.status = newStatus;
        }
      });
      tdStatus.appendChild(select);
      tr.appendChild(tdStatus);

      // Time
      const tdTime = document.createElement('td');
      const createdAt = new Date(order.created_at);
      tdTime.textContent = formatTimeCanada(createdAt);
      tr.appendChild(tdTime);

      // Add row to table
      if (ordersTableBody) ordersTableBody.appendChild(tr);
    });
  }

  // ===== Feedback =====
  const feedbackLoading = document.getElementById('feedbackLoading');
  const feedbackTableBody = document.getElementById('feedbackTableBody');
  const feedbackNoData = document.getElementById('feedbackNoData');
  const btnExportFeedback = document.getElementById('btnExportFeedback');

  async function loadFeedback() {
    if (feedbackLoading) feedbackLoading.style.display = 'block';
    if (feedbackTableBody) feedbackTableBody.innerHTML = '';
    if (feedbackNoData) feedbackNoData.style.display = 'none';

    const { data, error } = await adminSupabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading feedback:', error);
      return;
    }

    if (feedbackLoading) feedbackLoading.style.display = 'none';

    if (!data || data.length === 0) {
      if (feedbackNoData) feedbackNoData.style.display = 'block';
      return;
    }

    // Render feedback
    data.forEach((fb) => {
      const tr = document.createElement('tr');

      // Name
      const tdName = document.createElement('td');
      tdName.textContent = fb.name || '';
      tr.appendChild(tdName);

      // Phone
      const tdPhone = document.createElement('td');
      tdPhone.textContent = fb.phone || '';
      tr.appendChild(tdPhone);

      // Message
      const tdMessage = document.createElement('td');
      tdMessage.textContent = fb.message;
      tr.appendChild(tdMessage);

      // Rating (1-5 or null)
      const tdRating = document.createElement('td');
      if (fb.rating) {
        tdRating.textContent = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
      } else {
        tdRating.textContent = '-';
      }
      tr.appendChild(tdRating);

      // Time
      const tdTime = document.createElement('td');
      const createdAt = new Date(fb.created_at);
      tdTime.textContent = formatDateTimeCanada(createdAt);
      tr.appendChild(tdTime);

      if (feedbackTableBody) feedbackTableBody.appendChild(tr);
    });
  }

  // Export feedback as CSV
  if (btnExportFeedback) {
    btnExportFeedback.addEventListener('click', async () => {
      const { data, error } = await adminSupabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error exporting feedback:', error);
        alert('Failed to export feedback');
        return;
      }

      // CSV header
      const csvRows = [];
      csvRows.push(['Name', 'Phone', 'Message', 'Rating', 'Created At'].join(','));

      data.forEach((fb) => {
        const row = [
          fb.name ? `"${fb.name.replace(/"/g, '""')}"` : '',
          fb.phone ? `"${fb.phone.replace(/"/g, '""')}"` : '',
          fb.message ? `"${fb.message.replace(/"/g, '""')}"` : '',
          fb.rating || '',
          new Date(fb.created_at).toISOString(),
        ]
          .map((val) => (typeof val === 'string' ? val : String(val)))
          .join(',');
        csvRows.push(row);
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `feedback_${getTodayCanada()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Initial load
  await loadOrders();
  await loadFeedback();

  // ===== Realtime Subscriptions =====
  // Orders: insert, update, delete
  const ordersChannel = adminSupabase
    .channel('orders-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        // Re-fetch orders on any change
        loadOrders();
      }
    )
    .subscribe();

  // Feedback: insert, update, delete
  const feedbackChannel = adminSupabase
    .channel('feedback-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'feedback' },
      () => {
        loadFeedback();
      }
    )
    .subscribe();

  // Cleanup on page unload (optional, but good practice)
  window.addEventListener('beforeunload', () => {
    adminSupabase.removeChannel(ordersChannel);
    adminSupabase.removeChannel(feedbackChannel);
  });
});