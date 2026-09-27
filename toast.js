/**
 * Toast Notification Component
 */

let toastTimeout = null;

export function showToast(message, type = "info") {
  const toast = document.getElementById('toastNotification');
  const msg = document.getElementById('toastMessage');
  const icon = document.getElementById('toastIcon');

  if (!toast || !msg || !icon) return;

  msg.textContent = message;

  if (type === 'success') {
    toast.className = "fixed bottom-5 right-5 z-50 max-w-md bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-3";
    icon.innerHTML = "&check;";
    icon.className = "text-emerald-400 font-bold text-base";
  } else if (type === 'error') {
    toast.className = "fixed bottom-5 right-5 z-50 max-w-md bg-rose-950 border border-rose-500 text-rose-100 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-3";
    icon.innerHTML = "&times;";
    icon.className = "text-rose-400 font-bold text-base";
  } else {
    toast.className = "fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 border border-sky-500 text-white px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-3";
    icon.innerHTML = "&bull;";
    icon.className = "text-sky-400 font-bold text-base";
  }

  toast.classList.remove('translate-y-20', 'opacity-0');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}
