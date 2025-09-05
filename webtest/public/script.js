async function update() {
  const pill = document.getElementById('status-pill');
  const pre = document.getElementById('info');
  try {
    const res = await fetch('/api/info', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    pill.textContent = 'OK';
    pill.classList.add('ok');
    pre.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    pill.textContent = 'ERROR';
    pill.classList.add('bad');
    pre.textContent = String(err);
  }
}

update();

