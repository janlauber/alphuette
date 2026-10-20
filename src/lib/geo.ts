/** WGS84 to Swiss LV95, swisstopo's approximate formula (about 1 m accuracy). */
export function toLv95(lat: number, lon: number) {
	const p = (lat * 3600 - 169028.66) / 10000;
	const l = (lon * 3600 - 26782.5) / 10000;
	const e = 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3;
	const n = 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p ** 3;
	return { e: Math.round(e), n: Math.round(n) };
}
