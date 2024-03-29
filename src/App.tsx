import { useEffect, useState } from "react";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { TextField } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Paper, Button } from "@mui/material";

interface Ticket {
  pjmTicketId: number;
  companyName: string;
  outageType: string;
  availability: string;
  status: string;
  // equipment: any;
}

interface Filter {
  outageStatus: string;
  outageType: string;
}

function App() {
  const [xmlData, setXMLData] = useState<Ticket[] | null>(null);
  const [filteredData, setFilteredData] = useState<Ticket[]>([]);

  useEffect(() => {
    axios.get("src/data/historical_outages_2024.xml").then((response) => {
      console.log("Your xml file as string", response.data);
      const parser = new XMLParser();
      const jObj = parser.parse(response.data);
      setXMLData(jObj?.toimwg?.ticket_info.ticket as Ticket[]);
    });
  }, []);
  console.log(xmlData);

  if (filteredData.length === 0 && xmlData) {
    setFilteredData(xmlData.slice(0, 15));
  }

  const { control, handleSubmit } = useForm({
    defaultValues: {
      outageStatus: "",
      outageType: "",
    },
  });

  const onSubmit: SubmitHandler<Filter> = (data) => {
    console.log(data);
  };

  return (
    <div className="p-10 bg-slate-300 h-screen">
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
              <TextField {...field} placeholder="Outage type" />
            )}
          />
          <Button variant="contained" type="submit">
            Filter
          </Button>
        </form>
        {/** 
         * 
Filtro para entradas de equipamento:
-Equipment status
-Start date e end date:  (startdate <= interval_end_datetime) &  (enddate >= interval_start_datetime)
-Voltage (em b2 name) 
-Text search que procura substring matches em b1name e b3text
  */}
      </section>
      <section>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>pjmTicketId</TableCell>
                <TableCell align="right">Company Name</TableCell>
                <TableCell align="right">Outage Type</TableCell>
                <TableCell align="right">Status</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
    </div>
  );
}

export default App;
