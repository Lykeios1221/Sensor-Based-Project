import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
  Divider,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  styled,
  Typography,
  CardActions,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import TokenIcon from "@mui/icons-material/Token";
import InfoIcon from "@mui/icons-material/Info";
import Zoom from "@mui/material/Zoom";
import LoadingButton from "@mui/lab/LoadingButton";
import { useState, FormEvent, useEffect } from "react";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import Background from "./assets/flat-mountains.svg";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogTitle-root": {
    backgroundColor: theme.palette.error.light,
  },
  "& .MuiDialogTitle-root svg": {
    color: "white",
    fontSize: 70,
    paddingBlock: "2rem",
  },
  "& .MuiDialogActions-root": {
    justifyContent: "center",
    paddingBottom: "1rem",
  },
}));

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = Background;
    img.onload = () => setBgLoaded(true);
  }, []);

  const handleClose = () => {
    setTokenValid(true);
  };

  const submitToken = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData(evt.currentTarget);
      const token = formData.get("token") as string;
      const response = await fetch("/api/validate_token", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.result) {
        localStorage.setItem("sensor_based_token", token);
        navigate("/", { replace: true });
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      setTokenValid(false);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!bgLoaded && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <CircularProgress />
        </Box>
      )}
      {bgLoaded && (
        <div id="auth-background">
          <Container maxWidth="lg" sx={{ height: "100%" }}>
            <Grid
              container
              alignItems="center"
              justifyContent="center"
              sx={{ height: "100%" }}
            >
              <Grid item xs={11} md={8}>
                <motion.div animate={{ y: [100, 0] }} initial={bgLoaded}>
                  <Card
                    sx={{
                      flexGrow: 1,
                      boxShadow: 8,
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(10px)",
                    }}
                    component={"form"}
                    onSubmit={submitToken}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <TokenIcon />
                        </Avatar>
                      }
                      action={
                        <Tooltip
                          title="This token is provided after successfully configuring the MCU. If you lost the token, please reconfigure the MCU to obtain a new token."
                          placement="right"
                          TransitionComponent={Zoom}
                          PopperProps={{
                            sx: {
                              lineHeight: "20px",
                            },
                          }}
                          arrow
                        >
                          <IconButton>
                            <InfoIcon color="info" />
                          </IconButton>
                        </Tooltip>
                      }
                      title="Authentication"
                      subheader="SHA256 Token"
                    />
                    <Divider />
                    <CardContent>
                      <Box paddingBlock={0.5}>
                        <FormControl
                          fullWidth
                          defaultValue=""
                          required
                          autoFocus
                        >
                          <InputLabel>Token</InputLabel>
                          <Input
                            id="token-input"
                            name="token"
                            type="text"
                            placeholder="Enter your token here"
                            fullWidth
                            autoFocus
                          />
                          <FormHelperText>
                            This token will be saved in your local storage upon
                            submit.
                          </FormHelperText>
                        </FormControl>
                      </Box>
                    </CardContent>
                    <CardActions
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      {loading ? (
                        <LoadingButton
                          loading
                          variant="contained"
                          sx={{ mt: 2, mb: 1 }}
                        >
                          Submit
                        </LoadingButton>
                      ) : (
                        <Button
                          type="submit"
                          variant="contained"
                          sx={{ mt: 2, mb: 1 }}
                        >
                          Submit
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </div>
      )}
      <BootstrapDialog open={!tokenValid}>
        <DialogTitle sx={{ bgcolor: "primary.error.main" }}>
          <Box display={"flex"} justifyContent={"center"}>
            <GppMaybeIcon />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            paddingTop={"1.5rem"}
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"center"}
          >
            <Typography
              gutterBottom
              textAlign={"center"}
              fontSize={"2rem"}
              color={"error.light"}
            >
              Invalid token!
            </Typography>
            <Typography textAlign={"center"} color={"text.secondary"}>
              If you lose the token or if the token malfunctions, please
              reconfigure the MCU to obtain a new token.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}
