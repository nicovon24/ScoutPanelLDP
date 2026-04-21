"use client";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import AppButton from "@/components/ui/AppButton";

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
              <AppButton
                type="button"
                isIconOnly
                variant="light"
                disableRipple
                onPress={() => toast.dismiss(t.id)}
                className="!min-w-0 w-6 h-6 min-w-6 p-0 ml-2 text-[#959595] hover:text-[#F2F2F2] bg-transparent"
                aria-label="Cerrar"
              >
                ×
              </AppButton>
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
