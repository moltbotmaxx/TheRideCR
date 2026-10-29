// Authoritative preset fares, in USD. Custom routes require manual confirmation.
export const fares = {
  'SJO Airport': { 'San José Hotels': 60, 'La Fortuna / Arenal': 200, Monteverde: 230, 'Nicoya / Tamarindo': 280, 'Manuel Antonio / Quepos': 250, 'Puerto Viejo': 300, 'Uvita / Dominical': 300 },
  'LIR Airport': { 'San José Hotels': 300, 'La Fortuna / Arenal': 220, Monteverde: 250, 'Nicoya / Tamarindo': 110, 'Manuel Antonio / Quepos': 430, 'Puerto Viejo': 530, 'Uvita / Dominical': 500 },
  'San José Hotels': { 'La Fortuna / Arenal': 200, Monteverde: 230, 'Nicoya / Tamarindo': 280, 'Manuel Antonio / Quepos': 220, 'Puerto Viejo': 250, 'Uvita / Dominical': 280, 'SJO Airport': 60 },
  'La Fortuna / Arenal': { Monteverde: 130, 'Nicoya / Tamarindo': 270, 'Puerto Viejo': 370, 'SJO Airport': 200 },
  'Manuel Antonio / Quepos': { 'San José Hotels': 220, 'Uvita / Dominical': 80, 'SJO Airport': 250 },
};
export function getFare(from, to, pax) {
  const normalize = (v) => v === 'San Jose Hotels' ? 'San José Hotels' : v;
  from = normalize(from); to = normalize(to);
  const base = fares[from]?.[to] || fares[to]?.[from];
  return base ? Math.round(base * (pax > 3 ? 1.15 : 1)) : null;
}
