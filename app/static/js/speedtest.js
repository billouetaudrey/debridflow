// --- SPEEDTEST & BENCHMARK ENGINE ---
let isRunningSpeedtest = false;

async function runIntegratedSpeedtest() {
  if (isRunningSpeedtest) return;
  isRunningSpeedtest = true;

  const btn = document.getElementById('btn-run-speedtest');
  const statusBar = document.getElementById('st-status-bar');
  const statusMsg = document.getElementById('st-status-msg');

  if (btn) btn.disabled = true;
  if (statusBar) statusBar.style.display = 'flex';
  if (statusMsg) statusMsg.textContent = currentLang === 'en' ? 'Testing latency, download and upload speeds...' : 'Mesure des latences et du débit réel en cours...';

  const resetFields = () => {
    const elAd = document.getElementById('st-ad-ping');
    const elAdSt = document.getElementById('st-ad-status');
    const elGlobal = document.getElementById('st-global-ping');
    const elDl = document.getElementById('st-dl-speed');
    const elDlMb = document.getElementById('st-dl-mbs');
    const elUl = document.getElementById('st-ul-speed');
    const elUlMb = document.getElementById('st-ul-mbs');
    if (elAd) elAd.textContent = '...';
    if (elAdSt) elAdSt.textContent = '';
    if (elGlobal) elGlobal.textContent = '...';
    if (elDl) elDl.textContent = '...';
    if (elDlMb) elDlMb.textContent = '';
    if (elUl) elUl.textContent = '...';
    if (elUlMb) elUlMb.textContent = '';
  };
  resetFields();

  try {
    const res = await fetch('/api/speedtest/run', { method: 'POST' });
    const data = await res.json();

    const elAd = document.getElementById('st-ad-ping');
    const elAdSt = document.getElementById('st-ad-status');
    const elGlobal = document.getElementById('st-global-ping');
    const elDl = document.getElementById('st-dl-speed');
    const elDlMb = document.getElementById('st-dl-mbs');
    const elUl = document.getElementById('st-ul-speed');
    const elUlMb = document.getElementById('st-ul-mbs');
    const lastRun = document.getElementById('st-last-run');

    if (elAd) elAd.textContent = data.alldebrid_ping_ms !== null ? `${data.alldebrid_ping_ms} ms` : 'Injoignable';
    if (elAdSt) elAdSt.textContent = data.alldebrid_status ? `(${data.alldebrid_status})` : '';
    if (elGlobal) elGlobal.textContent = data.ping_ms !== null ? `${data.ping_ms} ms` : '-- ms';
    if (elDl) elDl.textContent = data.download_mbps > 0 ? `${data.download_mbps} Mbps` : '-- Mbps';
    if (elDlMb) elDlMb.textContent = data.download_mbs > 0 ? `(${data.download_mbs} Mo/s)` : '';
    if (elUl) elUl.textContent = data.upload_mbps > 0 ? `${data.upload_mbps} Mbps` : '-- Mbps';
    if (elUlMb) elUlMb.textContent = data.upload_mbs > 0 ? `(${data.upload_mbs} Mo/s)` : '';

    if (lastRun) {
      const now = new Date();
      lastRun.textContent = (currentLang === 'en' ? 'Last test: ' : 'Dernier test : ') + now.toLocaleTimeString();
    }

    if (statusMsg) statusMsg.textContent = currentLang === 'en' ? 'Speed test completed successfully!' : 'Test de débit terminé avec succès !';
    setTimeout(() => {
      if (statusBar) statusBar.style.display = 'none';
    }, 4000);
  } catch (err) {
    if (statusMsg) statusMsg.textContent = (currentLang === 'en' ? 'Error: ' : 'Erreur : ') + err;
  } finally {
    isRunningSpeedtest = false;
    if (btn) btn.disabled = false;
  }
}




