import { useState } from "react";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

function App() {
  const [xmlData, setXMLData] = useState(null);

  axios.get("src/xml/historical_outages_2024.xml").then((response) => {
    console.log("Your xml file as string", response.data);
    const parser = new XMLParser();
    const jObj = parser.parse(response.data);
    setXMLData(jObj.toimwg.ticket_info);
    console.log(jObj);
  });

  return (
    <div className="p-10 bg-slate-300 h-screen">
      <h1 className="text-center font-semibold uppercase my-3 text-2xl">
        {"Caravela Project"}
      </h1>
      <section>
        <h3>Filters</h3>
        {/** 
         * 
Filtro para entradas de equipamento:
-Equipment status
-Start date e end date:  (startdate <= interval_end_datetime) &  (enddate >= interval_start_datetime)
-Voltage (em b2 name) 
-Text search que procura substring matches em b1name e b3text
  */}

        <input
          type="text"
          placeholder="Outage status"
          className="input input-bordered max-w-xs"
        />
        <input
          type="text"
          placeholder="Outage type"
          className="input input-bordered max-w-xs"
        />
        <input className="rounded border-1" type="date" />
        <button className="m-2 bg-gray-400 text-white p-2 rounded">
          Submit
        </button>
      </section>
      <section></section>
    </div>
  );
}

export default App;
