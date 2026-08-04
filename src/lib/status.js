export function deriveOverallStatus(status1, status2) {
  if (status1 === 'watching' || status2 === 'watching') {
    return 'watching';
  }

  if (status1 === 'watched' && status2 === 'watched') {
    return 'watched';
  }

  if (status1 === 'watched' || status2 === 'watched') {
    return 'watched';
  }

  return 'want_to_watch';
}