// Known US locations for the local region type-ahead.
// Format: "City, ST" — used for display and stored value.
// Extend this list or replace with a real geocoding API in Stage 2.
const LOCATIONS = [
  'Albuquerque, NM', 'Anaheim, CA', 'Anchorage, AK', 'Arlington, TX', 'Atlanta, GA',
  'Aurora, CO', 'Austin, TX', 'Bakersfield, CA', 'Baltimore, MD', 'Baton Rouge, LA',
  'Birmingham, AL', 'Boston, MA', 'Buffalo, NY', 'Charlotte, NC', 'Chicago, IL',
  'Cincinnati, OH', 'Cleveland, OH', 'Colorado Springs, CO', 'Columbus, OH', 'Corpus Christi, TX',
  'Dallas, TX', 'Denver, CO', 'Detroit, MI', 'El Paso, TX', 'Forth Worth, TX',
  'Fresno, CA', 'Hacienda Heights, CA', 'Henderson, NV', 'Honolulu, HI', 'Houston, TX',
  'Indianapolis, IN', 'Irvine, CA', 'Jacksonville, FL', 'Jersey City, NJ', 'Kansas City, MO',
  'Las Vegas, NV', 'Laredo, TX', 'Lexington, KY', 'Lincoln, NE', 'Long Beach, CA',
  'Los Angeles, CA', 'Louisville, KY', 'Madison, WI', 'Memphis, TN', 'Mesa, AZ',
  'Miami, FL', 'Milwaukee, WI', 'Minneapolis, MN', 'Nashville, TN', 'New Orleans, LA',
  'New York, NY', 'Newark, NJ', 'Norfolk, VA', 'Oakland, CA', 'Oklahoma City, OK',
  'Omaha, NE', 'Orlando, FL', 'Philadelphia, PA', 'Phoenix, AZ', 'Pittsburgh, PA',
  'Plano, TX', 'Portland, OR', 'Raleigh, NC', 'Reno, NV', 'Richmond, VA',
  'Riverside, CA', 'Sacramento, CA', 'Saint Paul, MN', 'Salt Lake City, UT', 'San Antonio, TX',
  'San Diego, CA', 'San Francisco, CA', 'San Jose, CA', 'Santa Ana, CA', 'Seattle, WA',
  'Spokane, WA', 'St. Louis, MO', 'Stockton, CA', 'Tampa, FL', 'Tucson, AZ',
  'Tulsa, OK', 'Virginia Beach, VA', 'Washington, DC', 'Wichita, KS', 'Winston-Salem, NC',
];

export function searchLocations(query) {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];
  return LOCATIONS.filter(loc => loc.toLowerCase().includes(q)).slice(0, 8);
}

export default LOCATIONS;
