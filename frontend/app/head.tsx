export default function Head() {
    return (
        <>
            {/* Prefer ICO (widely supported) and keep PNG fallbacks */}
            <link rel="icon" href="/MCC_Light.ico" />
            <link rel="icon" href="/MCC_Light.png" sizes="32x32" type="image/png" />
            <link rel="icon" href="/MCC2.png" sizes="32x32" type="image/png" />
            <link rel="apple-touch-icon" href="/MCC_Light.png" />
        </>
    )
}