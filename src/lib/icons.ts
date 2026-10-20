// Icons Tom can pick for amenities in the admin. Keys are stored in the database.
import BatteryCharging from '@lucide/svelte/icons/battery-charging';
import BedDouble from '@lucide/svelte/icons/bed-double';
import Cable from '@lucide/svelte/icons/cable';
import CigaretteOff from '@lucide/svelte/icons/cigarette-off';
import CookingPot from '@lucide/svelte/icons/cooking-pot';
import Dog from '@lucide/svelte/icons/dog';
import Droplets from '@lucide/svelte/icons/droplets';
import Flame from '@lucide/svelte/icons/flame';
import FlameKindling from '@lucide/svelte/icons/flame-kindling';
import House from '@lucide/svelte/icons/house';
import Info from '@lucide/svelte/icons/info';
import KeyRound from '@lucide/svelte/icons/key-round';
import Leaf from '@lucide/svelte/icons/leaf';
import MapPin from '@lucide/svelte/icons/map-pin';
import MountainSnow from '@lucide/svelte/icons/mountain-snow';
import Shirt from '@lucide/svelte/icons/shirt';
import ShowerHead from '@lucide/svelte/icons/shower-head';
import SignalLow from '@lucide/svelte/icons/signal-low';
import Snowflake from '@lucide/svelte/icons/snowflake';
import SquareParking from '@lucide/svelte/icons/square-parking';
import Sun from '@lucide/svelte/icons/sun';
import Thermometer from '@lucide/svelte/icons/thermometer';
import Toilet from '@lucide/svelte/icons/toilet';
import TreePine from '@lucide/svelte/icons/tree-pine';
import Users from '@lucide/svelte/icons/users';
import Utensils from '@lucide/svelte/icons/utensils';
import WifiOff from '@lucide/svelte/icons/wifi-off';

export const ICONS = {
	flame: Flame,
	'cooking-pot': CookingPot,
	'flame-kindling': FlameKindling,
	droplets: Droplets,
	thermometer: Thermometer,
	sun: Sun,
	'battery-charging': BatteryCharging,
	cable: Cable,
	snowflake: Snowflake,
	utensils: Utensils,
	shirt: Shirt,
	toilet: Toilet,
	'shower-head': ShowerHead,
	'bed-double': BedDouble,
	users: Users,
	'wifi-off': WifiOff,
	'signal-low': SignalLow,
	'square-parking': SquareParking,
	'key-round': KeyRound,
	dog: Dog,
	'cigarette-off': CigaretteOff,
	'tree-pine': TreePine,
	'mountain-snow': MountainSnow,
	house: House,
	'map-pin': MapPin,
	leaf: Leaf,
	info: Info
};

export type IconName = keyof typeof ICONS;
export const iconFor = (name: string) => ICONS[name as IconName] ?? Info;
