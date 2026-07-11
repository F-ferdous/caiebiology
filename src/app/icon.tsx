import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#A51212", // Website's default brand red (--red-500)
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: 7, // Rounded square like the logo box
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z" />
          <path d="M14.828 14.828l3.586 3.586a2 2 0 0 0 2.828 -2.828l-3.586 -3.586" />
          <path d="M9.172 9.172l-3.586 -3.586a2 2 0 1 0 -2.828 2.828l3.586 3.586" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
