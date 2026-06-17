import BaseModule from ".";
import UniverseInstance from "./Universe/UniverseInstance";

/**
 * Chrono class that stores time in
 * years, months, days, hours, minutes, and seconds.
 */
export default class Chrono extends BaseModule {
	private static universe: UniverseInstance;

	// Static constants for time unit lengths, relative to the one above
	// Months skipped to simplify timekeeping
	private static MINUTE_LENGTH = 60;
	private static HOUR_LENGTH = 60;
	private static HOUR_LENGTH_SECONDS = Chrono.HOUR_LENGTH * Chrono.MINUTE_LENGTH;
	/** Sidereal day */
	private static DAY_LENGTH = {
		HOURS: 23, MINUTES: 56, SECONDS: 4.0905
	}
	private static DAY_LENGTH_SECONDS = Chrono.daysToSeconds(1); // 86164.09053083288;
	/** Sidereal year */
	private static YEAR_LENGTH = {
		DAYS: 365, HOURS: 6, MINUTES: 9, SECONDS: 9.8
	};
	private static YEAR_LENGTH_SECONDS = (
		Chrono.daysToSeconds(this.YEAR_LENGTH.DAYS)
		+ Chrono.HMSToSeconds(
			this.YEAR_LENGTH.HOURS,
			this.YEAR_LENGTH.MINUTES,
			this.YEAR_LENGTH.SECONDS
		)
	);

	public static readonly zero = new Chrono(0, 0, 0, 0, 0);

	// Time components
	public readonly years: number;
	public readonly days: number;
	public readonly hours: number;
	public readonly minutes: number;
	public readonly seconds: number;

	/**
	 * Creates a new Chrono instance with the specified time components.
	 */
	public constructor(
		years: number = 0,
		days: number = 0,
		hours: number = 0,
		minutes: number = 0,
		seconds: number = 0
	) {
		super();
		this.years = years;
		this.days = days;
		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
	}

	/**
	 * Creates a new Chrono instance from a total number of seconds.
	 * @param totalSeconds Assumed to be positive.
	 */
	public static fromSeconds(totalSeconds: number): Chrono {
		// Convert total seconds to time components
		let remainingSeconds = totalSeconds;
		
		const years = math.floor(remainingSeconds / Chrono.YEAR_LENGTH_SECONDS);
		remainingSeconds = mod(remainingSeconds, Chrono.YEAR_LENGTH_SECONDS);

		const days = math.floor(remainingSeconds / Chrono.DAY_LENGTH_SECONDS);
		remainingSeconds = mod(remainingSeconds, Chrono.DAY_LENGTH_SECONDS);
		
		const hours = math.floor(remainingSeconds / Chrono.HOUR_LENGTH_SECONDS);
		remainingSeconds = mod(remainingSeconds, Chrono.HOUR_LENGTH_SECONDS);
		
		const minutes = math.floor(remainingSeconds / Chrono.MINUTE_LENGTH);
		remainingSeconds = mod(remainingSeconds, Chrono.MINUTE_LENGTH);
		
		const seconds = remainingSeconds;
		
		return new Chrono(years, days, hours, minutes, seconds);
	}

	/**
	 * Returns a Chrono between min and max, inclusive.
	 * min or max can be omitted to clamp in only one direction.
	 */
	public static clamp(time: Chrono, min?: Chrono, max?: Chrono) {
		return Chrono.max(Chrono.min(time, max), min);
	}

	/**
	 * Returns the minimum value passed to the function.
	 */
	public static min(a: Chrono, b?: Chrono): Chrono {
		return a.greaterThan(b) ? b! : a;
	}

	/**
	 * Returns the maximum value passed to the function.
	 */
	public static max(a: Chrono, b?: Chrono): Chrono {
		return a.lessThan(b) ? b! : a;
	}

	/**
	 * Adds another Chrono instance to this one.
	 */
	public add(other: Chrono | number): Chrono {
		let years = this.years;
		let days = this.days;
		let hours = this.hours;
		let minutes = this.minutes;
		let seconds = this.seconds;
		if (other instanceof Chrono) {
			years += other.years;
			hours += other.hours;
			days += other.days;
			minutes += other.minutes;
			seconds += other.seconds;
		} else {
			seconds += other;
		}

		return Chrono.normalize(years, days, hours, minutes, seconds);
	}

	/**
	 * Subtracts another Chrono instance from this one.
	 */
	public sub(other: Chrono | number): Chrono {
		let years = this.years;
		let days = this.days;
		let hours = this.hours;
		let minutes = this.minutes;
		let seconds = this.seconds;

		if (other instanceof Chrono) {
			years -= other.years;
			days -= other.days;
			hours -= other.hours;
			minutes -= other.minutes;
			seconds -= other.seconds;
		} else {
			seconds -= other;
		}

		return Chrono.normalize(years, days, hours, minutes, seconds);
	}


	/**
	 * Compares this Chrono instance with another.
	 * Returns the difference in seconds.
	 */
	public compare(other: Chrono): number {
		// Raw seconds comparison for performance
		return this.toSeconds() - other.toSeconds();
	}

	/**
	 * Converts this Chrono instance to total seconds.
	 */
	public toSeconds(): number {
		const years = {
			days: this.years * Chrono.YEAR_LENGTH.DAYS,
			hours: this.years * Chrono.YEAR_LENGTH.HOURS,
			minutes: this.years * Chrono.YEAR_LENGTH.MINUTES,
			seconds: this.years * Chrono.YEAR_LENGTH.SECONDS
		}
		const days = {
			hours: (years.days + this.days) * Chrono.DAY_LENGTH.HOURS,
			minutes: (years.days + this.days) * Chrono.DAY_LENGTH.MINUTES,
			seconds: (years.days + this.days) * Chrono.DAY_LENGTH.SECONDS
		}
		return (
			this.seconds + days.seconds + years.seconds
			+ Chrono.MINUTE_LENGTH
			* (this.minutes + days.minutes + years.minutes
				+ Chrono.HOUR_LENGTH
				* (this.hours + days.hours + years.hours)
			)
		);
	}

	/**
	 * Checks if this Chrono instance equals another.
	 */
	public equals(other?: Chrono): other is Chrono {
		return other !== undefined && 
			this.years === other.years &&
			this.days === other.days &&
			this.hours === other.hours &&
			this.minutes === other.minutes &&
			this.seconds === other.seconds;
	}

	/**
	 * Checks if this Chrono instance is less than another.
	 */
	public lessThan(other?: Chrono | number): boolean {
		if (other !== undefined) {
			if (typeIs(other, "number"))
				return this.toSeconds() < other;
			else if (this.years !== other.years)
				return this.years < other.years;
			else if (this.days !== other.days)
				return this.days < other.days;
			else if (this.hours !== other.hours)
				return this.hours < other.hours;
			else if (this.minutes !== other.minutes)
				return this.minutes < other.minutes;
			else
				return this.seconds < other.seconds;
		} else return false;
	}

	/**
	 * Checks if this Chrono instance is less than or equal to another.
	 */
	public lessThanOrEqual(other?: Chrono | number): boolean {
		if (other !== undefined) {
			if (typeIs(other, "number"))
				return this.toSeconds() <= other;
			else if (this.years !== other.years)
				return this.years < other.years;
			else if (this.days !== other.days)
				return this.days < other.days;
			else if (this.hours !== other.hours)
				return this.hours < other.hours;
			else if (this.minutes !== other.minutes)
				return this.minutes < other.minutes;
			else
				return this.seconds <= other.seconds;
		} else return false;
	}

	/**
	 * Checks if this Chrono instance is greater than another.
	 */
	public greaterThan(other?: Chrono | number): boolean {
		if (other !== undefined) {
		if (typeIs(other, "number"))
				return this.toSeconds() > other;
			else if (this.years !== other.years)
				return this.years > other.years;
			else if (this.days !== other.days)
				return this.days > other.days;
			else if (this.hours !== other.hours)
				return this.hours > other.hours;
			else if (this.minutes !== other.minutes)
				return this.minutes > other.minutes;
			else
				return this.seconds > other.seconds;
		} else return false;
	}

	/**
	 * Checks if this Chrono instance is greater than or equal to another.
	 */
	public greaterThanOrEqual(other?: Chrono | number): boolean {
		if (other !== undefined) {
			if (typeIs(other, "number"))
				return this.toSeconds() >= other;
			else if (this.years !== other.years)
				return this.years > other.years;
			else if (this.days !== other.days)
				return this.days > other.days;
			else if (this.hours !== other.hours)
				return this.hours > other.hours;
			else if (this.minutes !== other.minutes)
				return this.minutes > other.minutes;
			else
				return this.seconds >= other.seconds;
		} else return false;
	}

	/**
	 * Returns a string representation of this Chrono instance.
	 */
	public toString(): string {
		return `${this.years}y ${this.days}d ${this.hours}:${this.minutes}:${this.seconds}`;
	}

	public deepClone(): Chrono {
		return this;
	}

	// Helper methods

	private static normalize(
		years: number, days: number, hours: number,
		minutes: number, seconds: number
	): Chrono {
		// years
		const yearsDifference = math.floor((
				Chrono.daysToSeconds(days)
				+ Chrono.HMSToSeconds(hours, minutes, seconds)
			) / Chrono.YEAR_LENGTH_SECONDS
		);
		years += yearsDifference;
		days -= yearsDifference * Chrono.YEAR_LENGTH.DAYS;
		hours -= yearsDifference * Chrono.YEAR_LENGTH.HOURS;
		minutes -= yearsDifference * Chrono.YEAR_LENGTH.MINUTES;
		seconds -= yearsDifference * Chrono.YEAR_LENGTH.SECONDS;

		// days
		const daysDifference = math.floor(
			Chrono.HMSToSeconds(hours, minutes, seconds)
			/ Chrono.DAY_LENGTH_SECONDS
		);
		days += daysDifference;
		hours -= daysDifference * Chrono.DAY_LENGTH.HOURS;
		minutes -= daysDifference * Chrono.DAY_LENGTH.MINUTES;
		seconds -= daysDifference * Chrono.DAY_LENGTH.SECONDS;

		// hours
		const hoursDifference = math.floor(
			(minutes + (seconds / Chrono.MINUTE_LENGTH))
			/ Chrono.HOUR_LENGTH
		);
		hours += hoursDifference;
		minutes -= hoursDifference * Chrono.HOUR_LENGTH;

		// minutes
		const minutesDifference = math.floor(seconds / Chrono.MINUTE_LENGTH);
		minutes += minutesDifference
		seconds -= minutesDifference * Chrono.MINUTE_LENGTH;

		return new Chrono(years, days, hours, minutes, seconds);
	}

	private static HMSToSeconds(hours: number, minutes: number, seconds: number): number {
		return (hours * Chrono.HOUR_LENGTH + minutes)
			* Chrono.MINUTE_LENGTH + seconds;
	}

	private static daysToSeconds(days: number): number {
		return Chrono.HMSToSeconds(
			days * Chrono.DAY_LENGTH.HOURS,
			days * Chrono.DAY_LENGTH.MINUTES,
			days * Chrono.DAY_LENGTH.SECONDS
		);
	}
}

function mod(n: number, d: number): number {
	return ((n % d) + d) % d;
}
