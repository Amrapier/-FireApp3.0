import React, { Component } from "react";
import { Table } from "react-bootstrap";
import { parseDateTime } from "../functions";
import Position from "./position";


export default class Asset extends React.Component<any, any> {

  // 1.3.5, if a volunteer is changed update the relevant fields and propogate the change up through parent components
  updateAsset = (newPosition: any): void => {
    let asset = this.props.asset;
    for (let i: number = 0; i < asset.volunteers.length; i++) {
      if (asset.volunteers[i].positionID === newPosition.positionID) {
        asset.volunteers[i].volunteer = newPosition.volunteer;
        i = asset.volunteers.length;
      }
    }
    this.props.updateAssetRequest(asset);
  }

  formatPositionInfo = (position: any): any => {
    /* 
    position: {
    shiftID: number
    positionID: number
    assigned: boolean
    volunteer:
    asset: string
    roles: string[]
    startTime: Date
    endTime: Date
    } */
    let asset = this.props.asset
    let positionInfo = {
      shiftID: asset.shiftID,
      positionID: position.positionID,
      assigned: true,
      volunteer: position.volunteer,
      assetClass: asset.assetClass,
      roles: position.roles,
      startTime: asset.startTime,
      endTime: asset.endTime
    }
    if (typeof positionInfo.volunteer === 'undefined') {
      positionInfo.assigned = false;
    }
    return positionInfo;
  }

  // 1.2.3
  render() {
    const { asset } = this.props;

    return (
      <Table className="mt-4" striped bordered hover size="sm">
        <thead>
          <tr>
            <td width="15%"><b>({asset.shiftID}) {asset.assetClass}</b> </td>
            <td colSpan={6}>
              <span>
                {parseDateTime(
                  asset.startTime,
                  asset.endTime
                )}
              </span>
            </td>
          </tr>
        </thead>
        <tbody>
          {asset.volunteers.map((position: any) =>
            <Position key={position.positionID}
              updateAsset={(a: any) => this.updateAsset(a)}
              volunteerList={this.props.volunteerList}
              assignedVolunteers={this.props.assignedVolunteers}
              position={this.formatPositionInfo(position)} />
          )}
        </tbody>
      </Table>
    );
  }
}
