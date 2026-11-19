// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The upstream client advertises its own Android app in a nagbar. A Zora venue
 * has no such app, so the nagbar never starts here.
 */
export function useAndroidAppNagbarStarted(): boolean {
	return false;
}
