import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Container,
  Divider,
  Drawer,
  Fab,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Button,
  CardActions,
  FormControl,
  Input,
  InputLabel,
  Typography,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import "@carbon/charts/styles.css";
import CircularProgress from "@mui/material/CircularProgress";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  ChartTabularData,
  GaugeChart,
  LineChart,
  LineChartOptions,
} from "@carbon/charts-react";
import useWebSocket from "react-use-websocket";
import Checkbox from "@mui/material/Checkbox";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ScaleTypes } from "@carbon/charts/interfaces";

type SetLoadingFunction = (loading: boolean) => void;

const SettingDrawer: React.FC<{ setLoading: SetLoadingFunction }> = ({
  setLoading,
}) => {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState([""]);
  const [setting, setSetting] = useState({
    disabled: false,
    recipients: [],
    skip: 0,
  });
  const [loading, setDrawerLoading] = useState(false);

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  useEffect(() => {
    async function getSetting() {
      try {
        const response = await fetch("/api/get_setting", {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const responseData = await response.json();
        setSetting(responseData);
        setLoading(false);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    }
    getSetting();
  }, []);

  const changeRecipients = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const formData = new FormData(evt.currentTarget);
    const recipientsString = formData.get("recipients") as string;
    const recipients = recipientsString.split(",").map((e) => e.trim());
    try {
      const response = await fetch("/api/change_recipients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients,
        }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      console.log(response);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  const onBuildModdel = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setDrawerLoading(true);
    const formData = new FormData(evt.currentTarget);
    const submissionData = {
      size: formData.get("size"),
      models: checked.filter((value) => value !== ""),
    };
    console.log(JSON.stringify(submissionData));
    try {
      const response = await fetch("/api/build_model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData = await response.json();
      if (responseData.result) {
        setDrawerLoading(false);
      }
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  const changeSkipRate = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const formData = new FormData(evt.currentTarget);
    const submissionData = {
      skip: formData.get("skip"),
    };
    try {
      const response = await fetch("/api/change_saving_skip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData = await response.json();
      console.log(responseData);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  const changeDisabled = async () => {
    try {
      const response = await fetch(
        "/api/change_user_disabled",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ disabled: !setting.disabled }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const toggleDisabledSetting = () => {
        setSetting((prevSetting) => ({
          ...prevSetting,
          disabled: !prevSetting.disabled,
        }));
      };

      toggleDisabledSetting();
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };
  return (
    <>
      <Fab
        color="primary"
        style={{
          margin: 0,
          top: "auto",
          right: 20,
          bottom: 20,
          left: "auto",
          position: "fixed",
        }}
        onClick={toggleDrawer(true)}
      >
        <TuneIcon />
      </Fab>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{ sx: { maxHeight: "65%" } }}
      >
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%" // Use full viewport height
          >
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <Container style={{ position: "relative" }}>
            <Grid container justifyContent="center">
              <Grid item lg={10} sm={11}>
                <Card
                  sx={{ border: "none", boxShadow: "none" }}
                  component="form"
                  onSubmit={onBuildModdel}
                >
                  <CardHeader
                    title={
                      <Typography
                        marginTop="0.5rem"
                        marginLeft={"1rem"}
                        fontSize={"2rem"}
                        variant="h2"
                        color="primary.main"
                      >
                        Rebuild Model
                      </Typography>
                    }
                    action={
                      <IconButton
                        sx={{ marginTop: "0.7rem" }}
                        onClick={() => {
                          setChecked([""]);
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    }
                  ></CardHeader>
                  <Divider></Divider>
                  <CardContent>
                    <List>
                      {["Environment", "Vibration", "Light"].map((value) => {
                        return (
                          <ListItem key={value} disablePadding>
                            <ListItemButton
                              role={undefined}
                              onClick={handleToggle(value)}
                              dense
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={checked.indexOf(value) !== -1}
                                  tabIndex={-1}
                                  disableRipple
                                />
                              </ListItemIcon>
                              <ListItemText primary={value} />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                  <CardActions>
                    <Box
                      columnGap={3}
                      width="100%"
                      display="flex"
                      justifyContent={"end"}
                      paddingInline={"1rem"}
                    >
                      <FormControl fullWidth>
                        <InputLabel>Dataset size</InputLabel>
                        <Input
                          name="size"
                          defaultValue="100"
                          type="number"
                          inputProps={{ min: "100", max: "1000" }}
                          placeholder="Enter dataset size"
                        ></Input>
                      </FormControl>
                      <Button type="submit">Confirm</Button>
                    </Box>
                  </CardActions>
                </Card>
                <Card
                  component="form"
                  onSubmit={changeRecipients}
                  sx={{ border: "none", boxShadow: "none", marginTop: "2rem" }}
                >
                  <CardHeader
                    title={
                      <Typography
                        marginTop="0.5rem"
                        marginLeft={"1rem"}
                        fontSize={"2rem"}
                        variant="h2"
                        color="primary.main"
                      >
                        Email notification
                      </Typography>
                    }
                  ></CardHeader>
                  <Divider></Divider>
                  <CardContent>
                    <FormControl fullWidth>
                      <InputLabel>Email</InputLabel>
                      <Input
                        defaultValue={
                          setting.recipients
                            ? setting.recipients.join(", ")
                            : ""
                        }
                        name="recipients"
                        placeholder="Enter email to be notified"
                      ></Input>
                      <FormHelperText>
                        You may enter more than 1 email by seperating them with
                        comma.
                      </FormHelperText>
                    </FormControl>
                  </CardContent>
                  <CardActions>
                    <Box
                      columnGap={3}
                      width="100%"
                      display="flex"
                      justifyContent={"end"}
                      paddingInline={"1rem"}
                    >
                      <Button type="submit">Confirm</Button>
                    </Box>
                  </CardActions>
                </Card>
                <Card
                  sx={{ border: "none", boxShadow: "none" }}
                  component="form"
                  onSubmit={changeSkipRate}
                >
                  <CardHeader
                    title={
                      <Typography
                        marginTop="0.5rem"
                        marginLeft={"1rem"}
                        fontSize={"2rem"}
                        variant="h2"
                        color="primary.main"
                      >
                        Data Saving
                      </Typography>
                    }
                  ></CardHeader>
                  <Divider></Divider>
                  <CardContent>
                    <Grid
                      container
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Grid item xs={9}>
                        <Typography>
                          The sampling rate of sensor is 1Hz no matter what.
                          However we do allow you to modify the saving rate by
                          skipping data entry.
                          <br />
                          <b>
                            **Please note that anomaly data will be recorded
                            instantly regarding the settings.
                          </b>
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <FormControl fullWidth sx={{ flexGrow: 1 }}>
                          <InputLabel>Skip rate</InputLabel>
                          <Input
                            type="number"
                            name="skip"
                            defaultValue={setting.skip}
                            placeholder="Change saving skip"
                          ></Input>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Box
                      columnGap={3}
                      width="100%"
                      display="flex"
                      justifyContent={"end"}
                      paddingInline={"1rem"}
                    >
                      <Button type="submit">Confirm</Button>
                    </Box>
                  </CardActions>
                </Card>
                <Tooltip title="This will disabled all output application including relay.">
                  <Button
                    variant="contained"
                    fullWidth
                    color={setting.disabled ? "primary" : "error"}
                    sx={{ margin: "1rem" }}
                    onClick={changeDisabled}
                  >
                    {setting.disabled
                      ? "Enable Detection"
                      : "Disable Detection"}
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </Container>
        )}
      </Drawer>
    </>
  );
};

interface SensorData {
  id: number;
  create_time: string;
  temperature: number;
  pressure: number;
  humidity: number;
  gas_concentration: number;
  lux: number;
  x_acceleration: number;
  y_acceleration: number;
  z_acceleration: number;
  x_rotation: number;
  y_rotation: number;
  z_rotation: number;
  environment_anomaly: boolean;
  light_anomaly: boolean;
  vibration_anomaly: boolean;
}

interface CollapseCardProps {
  title: string;
  content: React.ReactNode;
}

const CollapseCard: React.FC<CollapseCardProps> = ({ title, content }) => {
  const [open, setOpen] = useState(true);

  return (
    <Card sx={{ shadow: 8 }}>
      <CardHeader
        title={title}
        action={
          <IconButton onClick={() => setOpen(!open)} size="small">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        }
      />
      <Collapse in={open} timeout="auto">
        <Divider></Divider>
        <CardContent>{content}</CardContent>
      </Collapse>
    </Card>
  );
};

function lineData(
  data: SensorData[],
  key: keyof SensorData
): ChartTabularData {
  return data.map((item) => ({
    group: key,
    value: item[key] as number,
    date: item["create_time"],
  }));
}

function lineOption(title: string, x: string, y: string): LineChartOptions {

  return {
    title: title,
    axes: {
      bottom: {
        mapsTo: "date",
        title: x,
        scaleType: ScaleTypes.TIME,
      },
      left: {
        mapsTo: "value",
        title: y,
        scaleType: ScaleTypes.LINEAR,
      },
    },
    curve: "curveMonotoneX",
    zoomBar: {
      top: {
        enabled: true,
      },
    },
    height: "400px",
    getStrokeColor: (label) => {
      const colorList = [
        { index: 0, color: '#8a3ffc' },   // Purple 60
        { index: 1, color: '#33b1ff' },   // Cyan 40
        { index: 2, color: '#007d79' },   // Teal 60
        { index: 4, color: '#fa4d56' },   // Red 50
        { index: 5, color: '#fff1f1' },   // Red 10
        { index: 6, color: '#6fdc8c' },   // Green 30
        { index: 7, color: '#4589ff' },   // Blue 50
        { index: 8, color: '#d12771' },   // Magenta 60
        { index: 9, color: '#d2a106' },   // Yellow 40
        { index: 10, color: '#08bdba' },  // Teal 40
        { index: 11, color: '#bae6ff' },  // Cyan 20
        { index: 12, color: '#ba4e00' },  // Orange 60
        { index: 13, color: '#d4bbff' },  // Purple 30
      ];
      const hash = label.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 6) - acc);
      }, 0);
    
      // Calculate index based on hash value
      const index = Math.abs(hash) % colorList.length;
    
      return colorList[index].color;
    },
  };
}

const Homepage = () => {
  const token = localStorage.getItem("sensor_based_token");
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<SensorData[]>([]);
  const [query, setQuerying] = useState(true);

  const navigate = useNavigate();

  function getLuxData(data: SensorData[]) {
    if (!data || data.length === 0) {
      return []; // Handle case where data is empty or undefined
    }

    const latestEntry = data[data.length - 1]; // Get the latest entry in the data array
    let value = null;
    let delta = null;

    if (Object.prototype.hasOwnProperty.call(latestEntry, "lux")) {
      value = latestEntry.lux;
    }

    if (data.length > 1) {
      const previousEntry = data[data.length - 2];
      if (Object.prototype.hasOwnProperty.call(previousEntry, "lux")) {
        delta = latestEntry.lux - previousEntry.lux;
      }
    }
    return [
      {
        group: "value",
        value: value,
      },
      {
        group: "delta",
        value: delta,
      },
    ];
  }

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        navigate("/auth");
        return;
      }

      try {
        const response = await fetch("/api/validate_token", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!data.result) {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error validating token:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    }
    validateToken();
  }, [token, navigate]);

  useEffect(() => {
    async function query_data() {
      try {
        const response = await fetch("/api/query_data");
        const data = await response.json();
        setData(JSON.parse(data));
        setQuerying(false);
      } catch (error) {
        console.log(error);
      }
    }
    query_data();
  }, []);

  useWebSocket("/ws", {
    onOpen: () => {
      console.log("WebSocket connection opened");
    },
    onMessage: (event) => {
      console.log("Received WebSocket message:", event.data);
      const newMessage = JSON.parse(event.data);
      console.log("New data entry: " + newMessage);
      setData((prevData) => {
        const updatedData = [...prevData, newMessage];
        if (updatedData.length > 100) {
          updatedData.splice(0, updatedData.length - 100);
        }
        return updatedData;
      });
    },
    onClose: () => console.log("WebSocket connection closed"),
    shouldReconnect: () => true,
  });

  if (query || isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh" // Use full viewport height
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ background: "rbg(184, 184, 184)" }}>
      <Container maxWidth={"lg"}>
        <Grid container justifyContent="center" height="100%" paddingBlock={5}>
          <Grid item lg={12} sm={10} flexGrow={1}>
            <CollapseCard
              title="Environment"
              content={
                <Grid container justifyContent="space-evenly" rowGap={4}>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={lineData(data, "temperature")}
                      options={lineOption(
                        "Temperature  \u00B0C across time",
                        "Time",
                        "Temperature",
                      )}
                    ></LineChart>
                  </Grid>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={lineData(data, "humidity")}
                      options={lineOption(
                        "Relative Humidity across time",
                        "Time",
                        "Humidity",
                      )}
                    ></LineChart>
                  </Grid>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={lineData(data, "pressure")}
                      options={lineOption(
                        "Pressure (Pa) across time",
                        "Time",
                        "Pressure",
                      )}
                    ></LineChart>
                  </Grid>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={lineData(data, "gas_concentration")}
                      options={lineOption(
                        "Gas concentration (%) across time",
                        "Time",
                        "Gas concentration",
                      )}
                    ></LineChart>
                  </Grid>
                </Grid>
              }
            ></CollapseCard>
          </Grid>
          <Grid item lg={12} sm={12} flexGrow={1} marginTop={"2rem"}>
            <CollapseCard
              title="Light"
              content={
                <Grid container justifyContent="space-evenly" rowGap={4}>
                  <Grid item lg={5} sm={12}>
                    <Box display="flex" justifyContent="center">
                      <GaugeChart
                        options={{
                          title: "Light changes",
                          resizable: true,
                          height: "350px",
                          gauge: {
                            status: "warning",
                            type: "full",
                          },
                        }}
                        data={getLuxData(data)}
                      ></GaugeChart>
                    </Box>
                  </Grid>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={lineData(data, "lux")}
                      options={lineOption(
                        "Light intensitiy (lux) across time",
                        "Time",
                        "Light intensitiy",
                      )}
                    ></LineChart>
                  </Grid>
                </Grid>
              }
            ></CollapseCard>
          </Grid>
          <Grid item lg={12} sm={12} flexGrow={1} marginTop={"2rem"}>
            <CollapseCard
              title="Vibration"
              content={
                <Grid container justifyContent="space-evenly" rowGap={4}>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={[
                        ...lineData(data, "x_acceleration"),
                        ...lineData(data, "y_acceleration"),
                        ...lineData(data, "z_acceleration"),
                      ]}
                      options={lineOption(
                        "Acceleration (m/s^2) across time",
                        "Time",
                        "Acceration",
                      )}
                    ></LineChart>
                  </Grid>
                  <Grid item lg={5} sm={12}>
                    <LineChart
                      data={[
                        ...lineData(data, "x_rotation"),
                        ...lineData(data, "y_rotation"),
                        ...lineData(data, "z_rotation"),
                      ]}
                      options={lineOption(
                        "Rotation (rad/s) across time",
                        "Time",
                        "Rotation",
                      )}
                    ></LineChart>
                  </Grid>
                </Grid>
              }
            ></CollapseCard>
          </Grid>
        </Grid>
      </Container>
      <SettingDrawer
        setLoading={(loading: boolean) => {
          setLoading(loading);
        }}
      ></SettingDrawer>
    </div>
  );
};

export default Homepage;
