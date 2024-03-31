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
interface Ticket {
  pjmTicketId: number;
  companyName: string;
  outageType: string;
  availability: string;
  status: string;
  cause: string;
  equipment: Equipment[];
  statusLogs: {
    statusLog: {
      status: string;
      statusTime: string;
    }[];
  };
  dateLogs: {
    datelog: {
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
    }[];
  };
}

interface Filter {
  outageStatus: string;
  outageType: string;
  voltage: string;
  equipment: string;
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

  if (filteredData.length === 0 && xmlData) {
    setFilteredData(xmlData.slice(0, 15));
  }

  const { control, handleSubmit } = useForm({
    defaultValues: {
      outageStatus: "",
      outageType: "",
      voltage: "",
      equipment: "",
    },
  });

  const onSubmit: SubmitHandler<Filter> = ({
    outageStatus,
    outageType,
    voltage,
    equipment,
  }) => {
    let filteredData: Ticket[] = [];

    if (xmlData && outageStatus) {
      filteredData = xmlData.filter((ticket) =>
        ticket.status.includes(outageStatus)
      );
    }

    if (xmlData && outageType) {
      filteredData = xmlData.filter(
        (ticket) => ticket.outageType === outageType
      );
    }

    if (xmlData && voltage) {
      filteredData = xmlData.filter(
        (ticket) =>
          Array.isArray(ticket?.equipment) &&
          ticket?.equipment?.find((e) => e.b2Name.includes(voltage))
      );
    }

    if (xmlData && equipment) {
      filteredData = xmlData.filter(
        (ticket) =>
          Array.isArray(ticket?.equipment) &&
          ticket?.equipment?.find(
            (e) =>
              e?.b1Name?.includes(equipment) || e?.b3Text?.includes(equipment)
          )
      );
    }

    console.log({ filteredData });

    setFilteredData(filteredData);
  };

  return (
    <Container maxWidth="xl">
      <h1 className="text-center font-semibold uppercase my-3 text-2xl">
        {"Caravela Project"}
      </h1>
      <section>
        <h3>Filters</h3>
        <form onSubmit={handleSubmit(onSubmit)}>
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
              <Select
                {...field}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                label="Select"
                placeholder="Select"

                //onChange={handleChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={"Continuous"}>Continuous</MenuItem>
                <MenuItem value={"DailyNoWeekends"}>Daily No Weekends</MenuItem>
                <MenuItem value={"ContinuousNoWeekends"}>
                  Continuous No Weekends
                </MenuItem>
                <MenuItem value={"DailyIncludingWeekends"}>
                  Daily Including Weekends
                </MenuItem>
              </Select>
            )}
          />
          <div className="my-2">
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
          </div>
          <Button variant="contained" type="submit">
            Filter
          </Button>
        </form>
        {/** 
         * 
Filtro para entradas de equipamento:
-Equipment status
-Start date e end date:  (startdate <= interval_end_datetime) &  (enddate >= interval_start_datetime)
  */}
      </section>
      <section className="my-4">
        <div>{`Showing ${filteredData.length} results`}</div>

        <TableContainer component={Paper}>
          <Table>
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
              {filteredData.map((ticket: Ticket) => (
                <TableRow
                  key={ticket.pjmTicketId}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {ticket.pjmTicketId}
                  </TableCell>
                  <TableCell align="right">{ticket.companyName}</TableCell>
                  <TableCell align="right">{ticket.outageType}</TableCell>
                  <TableCell align="right">{ticket.status}</TableCell>
                  <TableCell align="right">{ticket.cause}</TableCell>
                  <TableCell sx={{ minWidth: 300 }}>
                    {ticket?.equipment?.map((e, index) => {
                      const { intervalDefinition, b1Name, b2Name, b3Text } = e;
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
                    })}
                  </TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
    </Container>
  );
}

export default App;
