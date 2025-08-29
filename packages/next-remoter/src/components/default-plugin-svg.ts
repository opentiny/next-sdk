// 获取 SVG 图像的源码
const svgString = `
<svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <clipPath id="clip657_188316">
            <rect  width="20" height="20" transform="translate(20 0) rotate(90)" fill="white" fill-opacity="0"></rect>
        </clipPath>
    </defs>
    <g clip-path="url(#clip657_188316)">
        <path id="path" d="M11.87 17.5L11.87 2.53C11.87 2.19 12.15 1.91 12.49 1.91C12.84 1.91 13.12 2.19 13.12 2.53L13.12 17.5C13.12 17.84 12.84 18.12 12.49 18.12C12.15 18.12 11.87 17.84 11.87 17.5Z" fill="currentColor" fill-opacity="1" fill-rule="nonzero"></path>
        <path id="path" d="M3.76 9.99C3.76 9.16 3.92 8.36 4.25 7.61C4.56 6.89 5.01 6.23 5.58 5.67C6.75 4.53 8.3 3.89 9.96 3.89L12.2 3.89L12.2 5.14L9.96 5.14C7.23 5.14 5.01 7.32 5.01 9.99C5.01 12.66 7.23 14.83 9.96 14.83L12.2 14.83L12.2 16.08L9.96 16.08C8.3 16.08 6.75 15.45 5.58 14.3C5.01 13.74 4.56 13.09 4.25 12.36C3.92 11.61 3.76 10.81 3.76 9.99Z" fill="currentColor" fill-opacity="1" fill-rule="nonzero"></path>
        <path id="path" d="M1.25 9.97C1.25 9.63 1.53 9.35 1.87 9.35L4.37 9.35C4.72 9.35 5 9.63 5 9.97C5 10.32 4.72 10.6 4.37 10.6L1.87 10.6C1.53 10.6 1.25 10.32 1.25 9.97ZM12.5 6.25C12.5 5.9 12.78 5.62 13.12 5.62L17.46 5.62C17.8 5.62 18.08 5.9 18.08 6.25C18.08 6.59 17.8 6.87 17.46 6.87L13.12 6.87C12.78 6.87 12.5 6.59 12.5 6.25ZM12.5 13.73C12.5 13.39 12.78 13.11 13.12 13.11L17.46 13.11C17.8 13.11 18.08 13.39 18.08 13.73C18.08 14.08 17.8 14.36 17.46 14.36L13.12 14.36C12.78 14.36 12.5 14.08 12.5 13.73Z" fill="currentColor" fill-opacity="1" fill-rule="nonzero"></path>
    </g>
</svg>
`
const base64 = btoa(svgString)

// 由于 插头的图标，只有Vue组件式的，但是mcpServersPicker是需要 url式的图标 。
export const defaultPluginSrc = `data:image/svg+xml;base64,${base64}`
