import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MedicalExaminerProcess = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Medical Examiner Process</h1>
          <p className="text-muted-foreground mb-6">
            This page provides detailed information about our Medical Examiner Death Certification process,
            including the flow chart and supporting documentation.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Process Flow Chart</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                View or download our comprehensive Medical Examiner Process Flow Chart:
              </p>
              <object
                data="/Flowchart-ME-Process-NBC-Final-1.pdf"
                type="application/pdf"
                width="100%"
                height="500px"
                className="mb-4"
              >
                <p>
                  Unable to display PDF file.{" "}
                  <a
                    href="/Flowchart-ME-Process-NBC-Final-1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Download PDF
                  </a>
                </p>
              </object>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Supporting Documentation</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <img
                  src="/WhatsApp Image 2024-10-02 at 3.50.07 PM.jpeg"
                  alt="Medical Examiner Process Documentation 1"
                  className="rounded-lg w-full h-auto shadow-lg object-contain"
                  loading="lazy"
                />
              </div>
              <div className="space-y-4">
                <img
                  src="/WhatsApp Image 2024-10-02 at 3.50.07 PM (1).jpeg"
                  alt="Medical Examiner Process Documentation 2"
                  className="rounded-lg w-full h-auto shadow-lg object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Cemetery Fees and Charges Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Cemetery Fees and Charges</CardTitle>
              <p className="text-sm text-muted-foreground">
                Effective from 1st April 2024 - Fixed under section 15 (1) of the Local Authorities Cemeteries Orders 1977
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unpurchased Graves Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Graves for which NO Exclusive Right of Burial has been granted</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span>A child in the Forget Me Not Garden</span>
                    <span className="font-semibold">No charge</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Stillborn child or child under 16 years (unpurchased grave)</span>
                    <span className="font-semibold">No charge</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Child from outside of East Staffordshire</span>
                    <span className="font-semibold">£48.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Person over 16 years</span>
                    <span className="font-semibold">£792.00</span>
                  </div>
                </div>
              </div>

              {/* Exclusive Right Graves Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Graves for which an EXCLUSIVE RIGHT OF BURIAL has been granted</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span>Purchase of Exclusive Right of Burial</span>
                    <span className="font-semibold">£1,245.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Purchase of Exclusive Right of Burial for cremated remains</span>
                    <span className="font-semibold">£433.00</span>
                  </div>
                </div>

                <h4 className="text-md font-medium mt-4 mb-2">Plus for the burial of:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span>Stillborn child or child under 16 years</span>
                    <span className="font-semibold">No charge</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Child from outside of East Staffordshire</span>
                    <span className="font-semibold">£48.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Person over 16 years</span>
                    <span className="font-semibold">£792.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Additional cost for bricked grave</span>
                    <span className="font-semibold">£219.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Burial of cremated remains</span>
                    <span className="font-semibold">£219.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Admin charge for multiple interments</span>
                    <span className="font-semibold">£54.00</span>
                  </div>
                </div>
              </div>

              {/* Miscellaneous Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Miscellaneous</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span>Transfer of ownership of Exclusive Right of Burial</span>
                    <span className="font-semibold">£57.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Slabbing or sealing a grave</span>
                    <span className="font-semibold">£168.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Preparation for the exhumation of a body (administration costs)</span>
                    <span className="font-semibold">£1,265.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Fees for searches of Registers including copy of entry</span>
                    <span className="font-semibold">£26.00</span>
                  </div>
                </div>
              </div>

              {/* Monuments Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Monuments, Gravestones, Tablets & Monumental Inscriptions</h3>
                <h4 className="text-md font-medium mb-2">PERMIT CHARGES</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  For the right to place on a grave for which the Exclusive Right of Burial has been granted:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="flex-1">A gravestone, cross, book or scroll (max: 1,350mm height, 914mm width, 460mm depth)</span>
                    <span className="font-semibold ml-4">£378.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex-1">Cremated remains section (max: 610mm height, 610mm width, 460mm depth)</span>
                    <span className="font-semibold ml-4">£378.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>A vase (unless incorporated in a memorial)</span>
                    <span className="font-semibold">£94.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Each inscription after the first</span>
                    <span className="font-semibold">£122.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>The Forget-Me-Not Memorial</span>
                    <span className="font-semibold">£60.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>The Forget-Me-Not Vase</span>
                    <span className="font-semibold">£48.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>The Forget Me Not Plaque: double (incl. VAT)</span>
                    <span className="font-semibold">£227.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Kerb memorial</span>
                    <span className="font-semibold">£889.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Full kerbset (kerbs & headstone)</span>
                    <span className="font-semibold">£1,267.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Memorial replacement fee</span>
                    <span className="font-semibold">£120.00</span>
                  </div>
                </div>
              </div>

              {/* Burial Times Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Burial Times</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Out of hours burial (Monday to Friday only 4-7pm) may take place by special arrangement
                  subject to availability of staff and safe lighting conditions: £180.00 per hour (50% reduction if less than 30 minutes)
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Fees are in addition to Exclusive Right of Burial, Interment and Chapel fees
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-left">Latest burial start time</th>
                        <th className="px-4 py-2 text-left">Burial conclusion time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2">January</td>
                        <td className="px-4 py-2">2.30pm</td>
                        <td className="px-4 py-2">3.30pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">February</td>
                        <td className="px-4 py-2">3.30pm</td>
                        <td className="px-4 py-2">4.30pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">March</td>
                        <td className="px-4 py-2">4.00pm</td>
                        <td className="px-4 py-2">5.00pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">April-August</td>
                        <td className="px-4 py-2">5.45pm</td>
                        <td className="px-4 py-2">6.45pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">September</td>
                        <td className="px-4 py-2">5.30pm</td>
                        <td className="px-4 py-2">6.30pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">October</td>
                        <td className="px-4 py-2">4.00pm</td>
                        <td className="px-4 py-2">5.00pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">November</td>
                        <td className="px-4 py-2">2.45pm</td>
                        <td className="px-4 py-2">3.45pm</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">December</td>
                        <td className="px-4 py-2">2.30pm</td>
                        <td className="px-4 py-2">3.30pm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Standing Regulations */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Standing Regulations</h3>
                <div className="space-y-4 text-sm">
                  <p>
                    The fees set out above apply only to those residing in the Borough of East Staffordshire
                    at the time of death. The normal requirement for residency is that the deceased lived within
                    the Borough for the twelve months prior to death.
                  </p>
                  <p>
                    For non-residents the interment fee and, where applicable, the Exclusive Right of Burial fee
                    is trebled. Non-residents are only exempt the trebling of these fees if either of the following
                    criteria apply:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      The deceased had previously lived within the Borough within the last 20 years for
                      a period exceeding 5 years
                    </li>
                    <li>
                      The deceased was a former resident within the Borough within the last 20 years
                      for a period exceeding 5 years but moved outside the Borough to a rest/nursing
                      home.
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MedicalExaminerProcess;