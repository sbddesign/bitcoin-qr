<script lang="ts">
	import { defineCustomElements } from 'bitcoin-qr/loader';

	defineCustomElements();
</script>

<h1>Bitcoin QR Code Examples</h1>

<h2>Default Behavior (URL)</h2>
<p>Click to open in wallet/app:</p>
<bitcoin-qr
	id="qr-url"
	width="300"
	height="300"
	bitcoin="BC1QYLH3U67J673H6Y6ALV70M0PL2YZ53TZHVXGG7U"
	parameters="?amount=0.00001&label=sbddesign%3A%20For%20lunch%20Tuesday&message=For%20lunch%20Tuesday"
	image="https://voltage.imgix.net/Team.png?fm=webp&w=160"
	type="svg"
	corners-square-color="#b23c05"
	corners-dot-color="#e24a04"
	corners-square-type="extra-rounded"
	dots-type="classy-rounded"
	dots-color="#ff5000"
	click-behavior="url"
	debug="true"
/>

<h2>Copy to Clipboard</h2>
<p>Click to copy the bitcoin address to clipboard:</p>
<bitcoin-qr
	id="qr-copy"
	width="300"
	height="300"
	bitcoin="BC1QYLH3U67J673H6Y6ALV70M0PL2YZ53TZHVXGG7U"
	image="https://voltage.imgix.net/Team.png?fm=webp&w=160"
	type="svg"
	corners-square-color="#b23c05"
	corners-dot-color="#e24a04"
	corners-square-type="extra-rounded"
	dots-type="classy-rounded"
	dots-color="#ff5000"
	click-behavior="copy"
	debug="true"
/>

<h2>No Click Action</h2>
<p>QR code with no click behavior:</p>
<bitcoin-qr
	id="qr-none"
	width="300"
	height="300"
	lightning="LNBC10U1P3PJ257PP5YZTKWJCZ5FTL5LAXKAV23ZMZEKAW37ZK6KMV80PK4XAEV5QHTZ7QDPDWD3XGER9WD5KWM36YPRX7U3QD36KUCMGYP282ETNV3SHJCQZPGXQYZ5VQSP5USYC4LK9CHSFP53KVCNVQ456GANH60D89REYKDNGSMTJ6YW3NHVQ9QYYSSQJCEWM5CJWZ4A6RFJX77C490YCED6PEMK0UPKXHY89CMM7SCT66K8GNEANWYKZGDRWRFJE69H9U5U0W57RRCSYSAS7GADWMZXC8C6T0SPJAZUP6"
	image="https://voltage.imgix.net/Team.png?fm=webp&w=160"
	type="svg"
	corners-square-color="#b23c05"
	corners-dot-color="#e24a04"
	corners-square-type="extra-rounded"
	dots-type="classy-rounded"
	dots-color="#ff5000"
	click-behavior="none"
	debug="true"
/>
