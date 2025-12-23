import {
  Backdrop,
  Button,
  CircularProgress,
  MobileStepper,
  Stack,
  Tooltip,
  TooltipProps,
} from "@mui/material";
import { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import React, { useState } from "react";

import { useTranslation } from "@/components/TranslationProvider";
import { IMAGE_BASE_URL } from "@/components/config";

const StyledImageTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(12),
    border: "0px solid #dadde9",
    maxWidth: "unset",
    overflow: "hidden",
    padding: 0,
  },
  [`& .${tooltipClasses.arrow}`]: {
    "&::before": {
      backgroundColor: "#f5f5f9",
    },
  },
}));

function useDeviceSize() {
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  const handleWindowResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  React.useEffect(() => {
    // component is mounted and window is available
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    // unsubscribe from the event on component unmount
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return [width, height];
}

export function ImageTooltip({
  title,
  disabled,
  children,
  ...props
}: {
  disabled?: boolean;
} & TooltipProps) {
  if (disabled) {
    return children;
  }
  return (
    <StyledImageTooltip
      arrow
      {...props}
      title={title}
      disableFocusListener={true}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                altAxis: true, // allow the tooltip to flip to the opposite side
                boundary: "viewport", // Constrains the tooltip to the viewport
              },
            },
          ],
        },
      }}
    >
      {children}
    </StyledImageTooltip>
  );
}

export function PageImagePreview(props: {
  page: string;
  imageURLs: { edition: string; url: string }[];
}) {
  const { t } = useTranslation();
  const [windowWidth, windowHeight] = useDeviceSize();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [curEdition, setCurEdition] = useState(0);

  return (
    <div>
      <Stack my={0.5} direction={"column"} alignItems={"center"}>
        {t("Image for page", {
          page: props.page,
          edition: props.imageURLs[curEdition].edition,
        })}
      </Stack>
      <Stack
        spacing={0}
        direction={"column"}
        alignItems={"center"}
        style={{
          minWidth: windowWidth * 0.4,
          minHeight: Math.min(windowHeight * 0.8, windowWidth * 0.6),
          position: "relative",
        }}
      >
        <Backdrop
          sx={{
            color: "#fff",
            zIndex: (theme) => theme.zIndex.drawer + 1,
            position: "absolute",
          }}
          open={!imageLoaded}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Image
          src={props.imageURLs[curEdition]?.url}
          alt={t("Image for page", {
            page: props.page,
            edition: props.imageURLs[curEdition]?.edition,
          })}
          style={{ objectFit: "contain" }}
          placeholder="empty"
          fill={true}
          onLoad={() => {
            setImageLoaded(true);
          }}
        />
      </Stack>
      <MobileStepper
        variant="dots"
        position="static"
        backButton={
          <Button
            disabled={curEdition === 0}
            onClick={() => {
              setCurEdition(curEdition - 1);
            }}
          >
            {t("Back")}
          </Button>
        }
        nextButton={
          <Button
            disabled={curEdition === props.imageURLs.length - 1}
            onClick={() => {
              setCurEdition(curEdition + 1);
            }}
          >
            {t("Next")}
          </Button>
        }
        steps={props.imageURLs.length}
      />
    </div>
  );
}
export function ImagePreviewLink({
  page_start,
  page_end,
  scan_urls,
  sourceTextColor,
}: {
  page_start: string;
  page_end: string;
  scan_urls:
    | {
        edition: string;
        page: string;
        url: string;
      }[]
    | null;
  sourceTextColor: string;
}) {
  const pages = [page_start];
  if (page_start !== page_end) {
    pages.push(page_end);
  }
  return (
    <>
      {pages.map((page, i) => {
        const urls = [];
        if (scan_urls !== null) {
          for (const scan of scan_urls) {
            if (page === scan.page) {
              const https_url =
                IMAGE_BASE_URL + "/" + scan.url.replace(/^s3:\/\//, "");
              urls.push({
                edition: scan.edition,
                url: https_url,
              });
            }
          }
        }

        return (
          <ImageTooltip
            title={<PageImagePreview page={page} imageURLs={urls} />}
            placement="right"
            key={i}
            disabled={urls.length === 0}
          >
            <span>
              <span
                className="pageNum"
                style={{
                  color: sourceTextColor,
                  textDecorationLine:
                    urls.length === 0 ? "inherit" : "underline",
                  textDecorationStyle: urls.length === 0 ? "inherit" : "solid",
                  textDecorationColor: sourceTextColor,
                  cursor: urls.length === 0 ? "inherit" : "default",
                }}
              >
                {page}
              </span>
              {i < pages.length - 1 ? "-" : null}
            </span>
          </ImageTooltip>
        );
      })}
    </>
  );
}
