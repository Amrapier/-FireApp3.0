import React from "react";
import "./home.scss";
import axios, { AxiosResponse, AxiosError } from "axios";

interface State {
  allow_makeNewRequest: boolean;
}

export default class Home extends React.Component<any, State> {
  
  state: State = {
    allow_makeNewRequest: true
  };

  makeNewRequest(): void {
    if (this.state.allow_makeNewRequest) {
      this.setState({ allow_makeNewRequest: false });
      
      axios.request({
        url: "NewAssetRequest",
        baseURL: "http://localhost:5000/",
        method: "GET",
        timeout: 15000,
        // withCredentials: true,
        headers: { "X-Requested-With": "XMLHttpRequest" }
      }).then((res: AxiosResponse): void => {
        console.log(res.data);
      }).catch((err: AxiosError): void => {
        alert(err.message);
        this.setState({ allow_makeNewRequest: true });
      });
    }
  }

  render() {
    return (
      <>
        <button className="type-1" onClick={()=>this.makeNewRequest()}>
          {this.state.allow_makeNewRequest ? (
            <>New Request</>
          ) : (
            <>Loading</>
          )}
        </button>
      </>
    );
  }
}