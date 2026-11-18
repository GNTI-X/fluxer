// SPDX-License-Identifier: AGPL-3.0-or-later

import styles from '@app/features/auth/components/AuthBrandPanel.module.css';
import type {AuthBrand} from '@app/features/auth/InstanceBranding';
import {FluxerWordmark, type WordmarkBranding} from '@app/features/ui/components/icons/FluxerWordmark';
import {flxElementClassName} from '@app/lib/react';
import ZoraMarkAsset from '@app/media/images/zora-mark.png';
import type React from 'react';
import {useCallback, useMemo, useState} from 'react';

const LOGO_BOX_PX = 128;
const WORDMARK_TEXT_STYLE: React.CSSProperties = {display: 'block', lineHeight: 1.1};

type AuthBrandLogo = {readonly kind: 'image'; readonly url: string} | {readonly kind: 'bundled'};

export const AuthBrandLayout = Object.freeze({
	CARD: 'card',
	MOBILE: 'mobile',
} as const);

export type AuthBrandLayout = (typeof AuthBrandLayout)[keyof typeof AuthBrandLayout];

interface AuthBrandLogoState {
	readonly logo: AuthBrandLogo | null;
	readonly onLogoError: () => void;
}

function resolveAuthBrandLogo(brand: AuthBrand | null, failedUrls: ReadonlySet<string>): AuthBrandLogo | null {
	if (brand == null) {
		return null;
	}
	for (const url of brand.logoCandidates) {
		if (!failedUrls.has(url)) {
			return {kind: 'image', url};
		}
	}
	return brand.usesDefaultName ? {kind: 'bundled'} : null;
}

export function useAuthBrandLogo(brand: AuthBrand | null): AuthBrandLogoState {
	const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());
	const logo = useMemo(() => resolveAuthBrandLogo(brand, failedUrls), [brand, failedUrls]);
	const failingUrl = logo?.kind === 'image' ? logo.url : null;
	const onLogoError = useCallback(() => {
		if (failingUrl == null) {
			return;
		}
		setFailedUrls((current) => new Set(current).add(failingUrl));
	}, [failingUrl]);
	return {logo, onLogoError};
}

interface AuthBrandPanelProps {
	readonly brand: AuthBrand;
	readonly logo: AuthBrandLogo | null;
	readonly onLogoError: () => void;
	readonly layout: AuthBrandLayout;
}

function renderLogo(logo: AuthBrandLogo | null, onLogoError: () => void): React.ReactNode {
	if (logo == null) {
		return null;
	}
	if (logo.kind === 'bundled') {
		return (
			<img
				className={styles.logo}
				src={ZoraMarkAsset}
				width={LOGO_BOX_PX}
				height={LOGO_BOX_PX}
				alt=""
				aria-hidden="true"
				draggable={false}
				decoding="async"
				data-flx="auth.components.auth-brand-panel.logo-bundled"
			/>
		);
	}
	return (
		<AuthBrandLogoImage
			key={logo.url}
			url={logo.url}
			onError={onLogoError}
			data-flx="auth.components.auth-brand-panel.logo"
		/>
	);
}

interface AuthBrandLogoImageProps {
	readonly url: string;
	readonly onError: () => void;
	readonly 'data-flx': string;
}

function AuthBrandLogoImage({url, onError, 'data-flx': dataFlx}: AuthBrandLogoImageProps): React.ReactElement {
	const [ratio, setRatio] = useState<number | null>(null);
	const style = useMemo(() => ({'--auth-brand-logo-ratio': ratio ?? 1}) as React.CSSProperties, [ratio]);
	return (
		<img
			className={styles.logo}
			style={style}
			src={url}
			alt=""
			width={LOGO_BOX_PX}
			height={LOGO_BOX_PX}
			draggable={false}
			decoding="async"
			referrerPolicy="no-referrer"
			onLoad={(event) => {
				const {naturalWidth, naturalHeight} = event.currentTarget;
				setRatio(naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1);
			}}
			onError={onError}
			data-pending={ratio == null ? '' : undefined}
			data-flx={dataFlx}
		/>
	);
}

export function AuthBrandPanel({brand, logo, onLogoError, layout}: AuthBrandPanelProps): React.ReactElement {
	const [failedWordmarkUrl, setFailedWordmarkUrl] = useState<string | null>(null);
	const wordmarkUrl = brand.wordmarkUrl === failedWordmarkUrl ? null : brand.wordmarkUrl;
	const wordmarkBranding = useMemo<WordmarkBranding>(
		() => ({productName: brand.productName, wordmarkUrl}),
		[brand.productName, wordmarkUrl],
	);
	const handleWordmarkError = useCallback(() => setFailedWordmarkUrl(brand.wordmarkUrl), [brand.wordmarkUrl]);
	// A self-hosted instance often points both knobs at the same file. Drawing
	// the logo and the wordmark then prints the brand twice above the card, so
	// the duplicate is skipped and the single asset stands in for both.
	const logoUrl = logo?.kind === 'image' ? logo.url : null;
	const wordmarkDuplicatesLogo = logoUrl != null && brand.wordmarkUrl === logoUrl;
	const wordmarkIsText = !wordmarkDuplicatesLogo && wordmarkUrl == null && !brand.usesDefaultName;
	return (
		<flx-auth-card-brand
			className={flxElementClassName(
				styles.brand,
				layout === AuthBrandLayout.MOBILE ? styles.mobile : styles.card,
				layout === AuthBrandLayout.CARD && logo != null && styles.split,
				wordmarkIsText && styles.textTier,
			)}
			data-flx="auth.components.auth-brand-panel.brand"
		>
			<flx-auth-card-brand-identity
				className={flxElementClassName(styles.identity)}
				data-flx="auth.components.auth-brand-panel.identity"
			>
				{renderLogo(logo, onLogoError)}
				{wordmarkDuplicatesLogo ? null : (
					<FluxerWordmark
						className={styles.wordmark}
						style={WORDMARK_TEXT_STYLE}
						branding={wordmarkBranding}
						onImageError={handleWordmarkError}
						data-flx="auth.components.auth-brand-panel.wordmark"
					/>
				)}
			</flx-auth-card-brand-identity>
			{brand.host == null ? null : (
				<span className={styles.host} dir="ltr" data-flx="auth.components.auth-brand-panel.host">
					{brand.host}
				</span>
			)}
		</flx-auth-card-brand>
	);
}
