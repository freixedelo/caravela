import {
  Button,
  Container,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Table,
  TableBody,
  TableCell,
} from "@mui/material";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { isEmpty } from "lodash";

interface Equipment {
  b1Name: string;
  b2Name: string;
  b3Text: string;
  intervalDefinition: {
    intervalStart: {
      date: string;
      time: string;
    };
    intervalEnd: {
      date: string;
      time: string;
    };
  };
}

interface DateLog {
  timestamp: string;
  intervalDefinition: {
    intervalStart: {
      date: string;
      time: string;
    };
    intervalEnd: {
      date: string;
      time: string;
    };
  };
}
interface Ticket {
  pjmTicketId: number;
  companyName: string;
  outageType: string;
  availability: string;
  status: string;
  cause: string;
  equipment: Equipment[] | Equipment;
  statusLogs: {
    statusLog: {
      status: string;
      statusTime: string;
    }[];
  };
  dateLogs: {
    datelog: DateLog[] | DateLog;
  };
}

interface Filter {
  outageStatus: string;
  outageType: string;
  voltage: string;
  equipment: string;
  equipmentStartDate: Dayjs | null;
  equipmentEndDate: Dayjs | null;
}

function App() {
  const [xmlData, setXMLData] = useState<Ticket[] | null>(null);
  const [filteredData, setFilteredData] = useState<Ticket[]>([]);

  useEffect(() => {
    axios.get("src/data/historical_outages_2024.xml").then((response) => {
      const parser = new XMLParser();
      const jObj = parser.parse(response.data);
      setXMLData(jObj?.toimwg?.ticket_info.ticket as Ticket[]);
    });
  }, []);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      outageStatus: "",
      outageType: " ",
      voltage: "",
      equipment: "",
      equipmentStartDate: null,
      equipmentEndDate: null,
    },
  });

  const onSubmit: SubmitHandler<Filter> = ({
    outageStatus,
    outageType,
    voltage,
    equipment,
    equipmentStartDate,
    equipmentEndDate,
  }) => {
    let filteredData: Ticket[] | null = xmlData;

    if (filteredData && !isEmpty(outageStatus)) {
      filteredData = filteredData.filter((ticket) =>
        ticket.status.includes(outageStatus)
      );
    }

    if (filteredData && !isEmpty(outageType) && outageType !== " ") {
      console.warn(outageType);
      filteredData = filteredData.filter(
        (ticket) => ticket.outageType === outageType
      );
    }

    if (filteredData && !isEmpty(voltage)) {
      filteredData = filteredData.filter(
        (ticket) =>
          Array.isArray(ticket?.equipment) &&
          ticket?.equipment?.find((e) => e.b2Name.includes(voltage))
      );
    }

    if (filteredData && !isEmpty(equipment)) {
      filteredData = filteredData.filter(
        (ticket) =>
          Array.isArray(ticket?.equipment) &&
          ticket?.equipment?.find(
            (e) =>
              e?.b1Name?.toString().includes(equipment) ||
              e?.b3Text?.includes(equipment)
          )
      );
    }

    //(startdate <= interval_end_datetime) &  (enddate >= interval_start_datetime)
    if (
      filteredData &&
      !isEmpty(equipmentStartDate) &&
      !isEmpty(equipmentEndDate)
    ) {
      filteredData = filteredData.filter(
        (ticket) =>
          Array.isArray(ticket?.equipment) &&
          ticket?.equipment?.find((e) => {
            const intervalEndDate = dayjs(
              e?.intervalDefinition.intervalEnd.date
            );
            const intervalStartDate = dayjs(
              e?.intervalDefinition.intervalEnd.date
            );
            return (
              intervalEndDate.isAfter(equipmentStartDate) &&
              intervalStartDate.isBefore(equipmentEndDate)
            );
          })
      );
    }

    console.log({ filteredData });

    filteredData && setFilteredData(filteredData);
  };

  if (!xmlData)
    return (
      <div className="w-full h-screen text-5xl text-center content-center uppercase font-semibold">
        Loading
      </div>
    );

  return (
    <Container maxWidth="xl">
      <h1 className="text-center font-semibold uppercase my-5 text-2xl">
        {"Caravela Project"}
      </h1>
      <section>
        <h3>Filters</h3>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="my-2 space-x-3">
            <Controller
              name="outageStatus"
              control={control}
              render={({ field }) => (
                <TextField {...field} placeholder="Outage status" />
              )}
            />

            <Controller
              name="outageType"
              control={control}
              render={({ field }) => (
                <>
                  <InputLabel id="outage-type-select-label">
                    Outage Type
                  </InputLabel>
                  <Select
                    {...field}
                    labelId="outage-type-select-label"
                    id="outage-type-select"
                    label="Select"
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  >
                    <MenuItem value=" ">
                      <em>Any</em>
                    </MenuItem>
                    <MenuItem value={"Continuous"}>Continuous</MenuItem>
                    <MenuItem value={"DailyNoWeekends"}>
                      Daily No Weekends
                    </MenuItem>
                    <MenuItem value={"ContinuousNoWeekends"}>
                      Continuous No Weekends
                    </MenuItem>
                    <MenuItem value={"DailyIncludingWeekends"}>
                      Daily Including Weekends
                    </MenuItem>
                  </Select>
                </>
              )}
            />
          </div>

          <div className="my-2 space-x-3">
            <Controller
              name="voltage"
              control={control}
              render={({ field }) => (
                <TextField {...field} placeholder="Voltage" />
              )}
            />
            <Controller
              name="equipment"
              control={control}
              render={({ field }) => (
                <TextField {...field} placeholder="Equipment" />
              )}
            />

            <Controller
              name="equipmentStartDate"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={field.value}
                    ref={field.ref}
                    onChange={(date) => {
                      field.onChange(date);
                    }}
                    label="Start date"
                  />
                </LocalizationProvider>
              )}
            />

            <Controller
              name="equipmentEndDate"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={field.value}
                    ref={field.ref}
                    onChange={(date) => {
                      field.onChange(date);
                    }}
                    label="End date"
                  />
                </LocalizationProvider>
              )}
            />
          </div>
          <Button variant="contained" type="submit">
            Filter
          </Button>
        </form>
      </section>

      <section className="my-4 overflow-hidden">
        <div className="my-4 text-right">{`Showing ${filteredData.length} results`}</div>

        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>pjmTicketId</TableCell>
                <TableCell align="right">Company Name</TableCell>
                <TableCell align="right">Outage Type</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right">Cause</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Status Logs</TableCell>
                <TableCell>Date Logs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((ticket: Ticket) => {
                return (
                  <TableRow
                    key={ticket.pjmTicketId}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      verticalAlign: "top",
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {ticket.pjmTicketId}
                    </TableCell>
                    <TableCell align="right">{ticket.companyName}</TableCell>
                    <TableCell align="right">{ticket.outageType}</TableCell>
                    <TableCell align="right">{ticket.status}</TableCell>
                    <TableCell align="right">{ticket.cause}</TableCell>
                    <TableCell>
                      {Array.isArray(ticket?.equipment) ? (
                        ticket?.equipment?.map((e, index) => {
                          const { intervalDefinition, b1Name, b2Name, b3Text } =
                            e;
                          const start = new Date(
                            `${intervalDefinition?.intervalStart.date}T${intervalDefinition?.intervalStart.time}Z`
                          );
                          const end = new Date(
                            `${intervalDefinition?.intervalEnd.date}T${intervalDefinition?.intervalEnd.time}Z`
                          );
                          const duration = end.getTime() - start.getTime();

                          return (
                            <div
                              className="py-3 border-b border-b-slate-500"
                              key={` ${b1Name}-${index}`}
                            >
                              {`${b2Name} - ${b1Name}`}
                              <br />
                              {b3Text}
                              <br />
                              <small>
                                {`Start: ${intervalDefinition?.intervalStart.date} ${intervalDefinition?.intervalStart.time}`}
                                <br />
                                {`End: ${intervalDefinition?.intervalEnd.date} ${intervalDefinition?.intervalEnd.time}`}
                                <br />
                                {` Duration: ${duration / (1000 * 60 * 60)} h`}
                              </small>
                              <br />
                            </div>
                          );
                        })
                      ) : (
                        <></>
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket?.statusLogs?.statusLog?.map((log, index) => {
                        const { status, statusTime } = log;

                        return (
                          <div
                            className="py-3 border-b border-b-slate-500"
                            key={` -${index}`}
                          >
                            {`${status} - ${statusTime}`}
                          </div>
                        );
                      })}
                    </TableCell>

                    <TableCell>
                      {Array.isArray(ticket?.dateLogs?.datelog) ? (
                        ticket?.dateLogs?.datelog?.map((log, index) => {
                          const { intervalDefinition, timestamp } = log;

                          return (
                            <div
                              className="py-3 border-b border-b-slate-500"
                              key={` -${index}`}
                            >
                              {`Start: ${intervalDefinition?.intervalStart.date} ${intervalDefinition?.intervalStart.time}`}
                              <br />
                              {`End: ${intervalDefinition?.intervalEnd.date} ${intervalDefinition?.intervalEnd.time}`}
                              <br />
                              {`Timestamp: ${timestamp} `}
                            </div>
                          );
                        })
                      ) : (
                        <></>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
    </Container>
  );
}

export default App;
