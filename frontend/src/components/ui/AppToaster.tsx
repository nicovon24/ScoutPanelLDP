"use client";
import { Toaster, ToastBar, toast } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 3500,
        style: {
          background: "#1C1C1C",
          color: "#F2F2F2",
          border: "1px solid #2C2C2C",
          borderRadius: "10px",
          fontSize: "13px",
          fontFamily: "'Nunito Sans', sans-serif",
          fontWeight: 600,
          padding: "10px 14px",
          maxWidth: "360px",
        },
        success: {
          iconTheme: { primary: "#00E094", secondary: "#1C1C1C" },
          style: { borderColor: "rgba(0, 224, 148, 0.25)" },
        },
        error: {
          iconTheme: { primary: "#EF4444", secondary: "#1C1C1C" },
          style: { borderColor: "rgba(239, 68, 68, 0.25)" },
          duration: 4500,
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  marginLeft: "8px",
                  flexShrink: 0,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#959595",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "0 2px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#F2F2F2"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#959595"; }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
